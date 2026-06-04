"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Send, Download, Copy, ArrowRight, AlertTriangle, CheckCircle } from "lucide-react";
import { useCopyState } from "@/components/tool/ToolLayout";

type Role = "sender" | "receiver";
type ConnectionState = "idle" | "creating" | "waiting" | "connecting" | "connected" | "transferring" | "done" | "error";

const CHUNK_SIZE = 16384; // 16KB chunks
const STUN_SERVER = "stun:stun.l.google.com:19302";

export function P2pTransferTool() {
  const [role, setRole] = useState<Role>("sender");
  const [connectionState, setConnectionState] = useState<ConnectionState>("idle");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sdpOffer, setSdpOffer] = useState("");
  const [sdpAnswer, setSdpAnswer] = useState("");
  const [remoteSdp, setRemoteSdp] = useState("");
  const [transferProgress, setTransferProgress] = useState(0);
  const [error, setError] = useState("");
  const [receivedFile, setReceivedFile] = useState<{ name: string; size: number; url: string } | null>(null);
  const [speed, setSpeed] = useState("");
  const { copied, handleCopy } = useCopyState();

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef<number>(0);
  const bytesSentRef = useRef<number>(0);

  const cleanup = useCallback(() => {
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // === SENDER LOGIC ===
  const startSender = async () => {
    if (!selectedFile) {
      setError("请先选择要发送的文件");
      return;
    }

    setConnectionState("creating");
    setError("");
    setSdpOffer("");
    setSdpAnswer("");

    try {
      const pc = new RTCPeerConnection({ iceServers: [{ urls: STUN_SERVER }] });
      peerConnectionRef.current = pc;

      const dc = pc.createDataChannel("fileTransfer", { ordered: true });
      dataChannelRef.current = dc;

      dc.onopen = () => {
        setConnectionState("connected");
      };

      dc.onclose = () => {
        if (connectionState !== "done") {
          setConnectionState("idle");
        }
      };

      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Wait for ICE gathering to complete
      await new Promise<void>((resolve) => {
        if (pc.iceGatheringState === "complete") {
          resolve();
        } else {
          const checkState = () => {
            if (pc.iceGatheringState === "complete") {
              pc.removeEventListener("icegatheringstatechange", checkState);
              resolve();
            }
          };
          pc.addEventListener("icegatheringstatechange", checkState);
          // Timeout after 10 seconds
          setTimeout(resolve, 10000);
        }
      });

      const localSdp = JSON.stringify(pc.localDescription);
      setSdpOffer(localSdp);
      setConnectionState("waiting");
    } catch (e) {
      setError(`创建连接失败：${(e as Error).message}`);
      setConnectionState("error");
      cleanup();
    }
  };

  const connectAsSender = async () => {
    if (!remoteSdp || !peerConnectionRef.current) return;

    setConnectionState("connecting");
    setError("");

    try {
      const remoteDesc = JSON.parse(remoteSdp);
      await peerConnectionRef.current.setRemoteDescription(remoteDesc);
    } catch (e) {
      setError(`连接失败：${(e as Error).message}，请确认粘贴的是接收方的 SDP Answer`);
      setConnectionState("waiting");
    }
  };

  const sendFile = async () => {
    if (!selectedFile || !dataChannelRef.current) return;

    const dc = dataChannelRef.current;
    if (dc.readyState !== "open") {
      setError("数据通道未就绪，请等待连接建立");
      return;
    }

    setConnectionState("transferring");
    setTransferProgress(0);
    startTimeRef.current = Date.now();
    bytesSentRef.current = 0;

    const file = selectedFile;
    const totalSize = file.size;
    let offset = 0;

    // Send file metadata first
    dc.send(JSON.stringify({
      type: "file-meta",
      name: file.name,
      size: file.size,
      mimeType: file.type,
    }));

    // Use a small delay to ensure metadata arrives first
    await new Promise((r) => setTimeout(r, 100));

    const reader = file.stream().getReader();

    const processChunk = async (): Promise<void> => {
      const result = await reader.read();
      if (result.done) {
        dc.send(JSON.stringify({ type: "file-end" }));
        setConnectionState("done");
        return;
      }

      const chunk = result.value as Uint8Array;
      // Split large chunks into smaller ones
      for (let i = 0; i < chunk.length; i += CHUNK_SIZE) {
        const slice = chunk.slice(i, Math.min(i + CHUNK_SIZE, chunk.length));

        // Wait if buffer is getting full
        while (dc.bufferedAmount > 65536) {
          await new Promise((r) => setTimeout(r, 50));
        }

        dc.send(slice);
        offset += slice.length;
        bytesSentRef.current = offset;

        const progress = (offset / totalSize) * 100;
        setTransferProgress(progress);

        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        if (elapsed > 0) {
          const speedBps = offset / elapsed;
          if (speedBps > 1024 * 1024) {
            setSpeed(`${(speedBps / (1024 * 1024)).toFixed(1)} MB/s`);
          } else {
            setSpeed(`${(speedBps / 1024).toFixed(1)} KB/s`);
          }
        }
      }

      return processChunk();
    };

    try {
      await processChunk();
    } catch (e) {
      setError(`传输失败：${(e as Error).message}`);
      setConnectionState("error");
    }
  };

  // === RECEIVER LOGIC ===
  const startReceiver = async () => {
    if (!remoteSdp) {
      setError("请先粘贴发送方的 SDP Offer");
      return;
    }

    setConnectionState("creating");
    setError("");
    setSdpAnswer("");

    try {
      const pc = new RTCPeerConnection({ iceServers: [{ urls: STUN_SERVER }] });
      peerConnectionRef.current = pc;

      // Handle incoming data channel
      pc.ondatachannel = (event) => {
        const dc = event.channel;
        dataChannelRef.current = dc;

        const receivedChunks: Uint8Array[] = [];
        let fileMeta: { name: string; size: number; mimeType: string } | null = null;
        let receivedBytes = 0;

        dc.onmessage = async (e) => {
          if (typeof e.data === "string") {
            const msg = JSON.parse(e.data);
            if (msg.type === "file-meta") {
              fileMeta = msg;
              receivedChunks.length = 0;
              receivedBytes = 0;
              setConnectionState("transferring");
              setTransferProgress(0);
            } else if (msg.type === "file-end" && fileMeta) {
              const blob = new Blob(receivedChunks.map(c => new Uint8Array(c)) as BlobPart[], { type: fileMeta.mimeType || "application/octet-stream" });
              const url = URL.createObjectURL(blob);
              setReceivedFile({ name: fileMeta.name, size: fileMeta.size, url });
              setConnectionState("done");
              setTransferProgress(100);
            }
          } else if (e.data instanceof ArrayBuffer) {
            const chunk = new Uint8Array(e.data as ArrayBuffer);
            receivedChunks.push(chunk);
            receivedBytes += chunk.byteLength;

            if (fileMeta) {
              const progress = (receivedBytes / fileMeta.size) * 100;
              setTransferProgress(progress);
            }
          } else if (e.data instanceof Blob) {
            const ab = await e.data.arrayBuffer();
            const chunk = new Uint8Array(ab);
            receivedChunks.push(chunk);
            receivedBytes += chunk.byteLength;

            if (fileMeta) {
              const progress = (receivedBytes / fileMeta.size) * 100;
              setTransferProgress(progress);
            }
          }
        };

        dc.onopen = () => {
          setConnectionState("connected");
        };
      };

      // Set remote description (the offer)
      const remoteDesc = JSON.parse(remoteSdp);
      await pc.setRemoteDescription(remoteDesc);

      // Create answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Wait for ICE gathering
      await new Promise<void>((resolve) => {
        if (pc.iceGatheringState === "complete") {
          resolve();
        } else {
          const checkState = () => {
            if (pc.iceGatheringState === "complete") {
              pc.removeEventListener("icegatheringstatechange", checkState);
              resolve();
            }
          };
          pc.addEventListener("icegatheringstatechange", checkState);
          setTimeout(resolve, 10000);
        }
      });

      const localSdp = JSON.stringify(pc.localDescription);
      setSdpAnswer(localSdp);
      setConnectionState("waiting");
    } catch (e) {
      setError(`创建连接失败：${(e as Error).message}`);
      setConnectionState("error");
      cleanup();
    }
  };

  const handleReset = () => {
    cleanup();
    setConnectionState("idle");
    setSelectedFile(null);
    setSdpOffer("");
    setSdpAnswer("");
    setRemoteSdp("");
    setTransferProgress(0);
    setError("");
    setReceivedFile(null);
    setSpeed("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 text-blue-700 dark:text-blue-400">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <p className="text-xs">
          P2P 文件传输基于 WebRTC，无需服务器中转。双方需要手动复制粘贴 SDP 信息来建立连接。需在 HTTPS 或 localhost 下使用。
        </p>
      </div>

      <Tabs value={role} onValueChange={(v) => { setRole(v as Role); handleReset(); }}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sender">
            <Send className="h-3.5 w-3.5 mr-1" /> 发送方
          </TabsTrigger>
          <TabsTrigger value="receiver">
            <Download className="h-3.5 w-3.5 mr-1" /> 接收方
          </TabsTrigger>
        </TabsList>

        {/* SENDER */}
        <TabsContent value="sender" className="space-y-4 mt-4">
          {/* Step 1: Select file */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Badge variant="outline" className="h-5 w-5 p-0 flex items-center justify-center text-xs">1</Badge>
                选择文件
              </div>
              <div
                className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Send className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                <p className="text-sm text-muted-foreground">
                  {selectedFile ? selectedFile.name : "点击选择文件"}
                </p>
                {selectedFile && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setSelectedFile(f);
                  }}
                />
              </div>
              <Button
                onClick={startSender}
                disabled={!selectedFile || connectionState === "creating" || connectionState === "waiting"}
                className="w-full"
              >
                {connectionState === "creating" ? "生成中..." : "生成连接信息"}
              </Button>
            </CardContent>
          </Card>

          {/* Step 2: Share SDP Offer */}
          {sdpOffer && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Badge variant="outline" className="h-5 w-5 p-0 flex items-center justify-center text-xs">2</Badge>
                  将以下信息发送给接收方
                </div>
                <Textarea
                  readOnly
                  value={sdpOffer}
                  className="font-mono text-xs h-28"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleCopy(sdpOffer)}
                >
                  <Copy className="h-3.5 w-3.5 mr-1" />
                  {copied ? "已复制" : "复制 SDP Offer"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Paste receiver's SDP Answer */}
          {sdpOffer && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Badge variant="outline" className="h-5 w-5 p-0 flex items-center justify-center text-xs">3</Badge>
                  粘贴接收方的 SDP Answer
                </div>
                <Textarea
                  value={remoteSdp}
                  onChange={(e) => setRemoteSdp(e.target.value)}
                  placeholder="粘贴接收方返回的 SDP Answer..."
                  className="font-mono text-xs h-28"
                />
                <Button
                  onClick={connectAsSender}
                  disabled={!remoteSdp || connectionState === "connecting"}
                  className="w-full"
                >
                  <ArrowRight className="h-3.5 w-3.5 mr-1" />
                  {connectionState === "connecting" ? "连接中..." : "建立连接"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Send file */}
          {connectionState === "connected" && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Badge variant="outline" className="h-5 w-5 p-0 flex items-center justify-center text-xs">4</Badge>
                  连接已建立，开始传输
                </div>
                <Button onClick={sendFile} className="w-full">
                  <Send className="h-4 w-4 mr-2" /> 发送文件
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* RECEIVER */}
        <TabsContent value="receiver" className="space-y-4 mt-4">
          {/* Step 1: Paste sender's SDP Offer */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Badge variant="outline" className="h-5 w-5 p-0 flex items-center justify-center text-xs">1</Badge>
                粘贴发送方的 SDP Offer
              </div>
              <Textarea
                value={remoteSdp}
                onChange={(e) => setRemoteSdp(e.target.value)}
                placeholder="粘贴发送方提供的 SDP Offer..."
                className="font-mono text-xs h-28"
              />
              <Button
                onClick={startReceiver}
                disabled={!remoteSdp || connectionState === "creating" || connectionState === "waiting"}
                className="w-full"
              >
                {connectionState === "creating" ? "生成中..." : "生成应答信息"}
              </Button>
            </CardContent>
          </Card>

          {/* Step 2: Share SDP Answer */}
          {sdpAnswer && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Badge variant="outline" className="h-5 w-5 p-0 flex items-center justify-center text-xs">2</Badge>
                  将以下信息发送给发送方
                </div>
                <Textarea
                  readOnly
                  value={sdpAnswer}
                  className="font-mono text-xs h-28"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleCopy(sdpAnswer)}
                >
                  <Copy className="h-3.5 w-3.5 mr-1" />
                  {copied ? "已复制" : "复制 SDP Answer"}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Transfer progress */}
      {(connectionState === "transferring" || connectionState === "done") && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                {connectionState === "done" ? "传输完成" : "传输中..."}
              </span>
              <span className="text-muted-foreground">
                {transferProgress.toFixed(1)}% {speed && `· ${speed}`}
              </span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300 rounded-full"
                style={{ width: `${Math.min(transferProgress, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Received file */}
      {receivedFile && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium">文件接收成功</span>
            </div>
            <div className="text-sm">
              <p><span className="text-muted-foreground">文件名：</span>{receivedFile.name}</p>
              <p><span className="text-muted-foreground">大小：</span>{(receivedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
            </div>
            <a
              href={receivedFile.url}
              download={receivedFile.name}
              className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground h-8 gap-1.5 px-2.5 text-sm font-medium whitespace-nowrap transition-all w-full"
            >
              <Download className="h-4 w-4 mr-2" /> 下载文件
            </a>
          </CardContent>
        </Card>
      )}

      {error && <p className="text-destructive text-sm">{error}</p>}

      {/* Reset button */}
      {connectionState !== "idle" && (
        <Button variant="outline" onClick={handleReset} className="w-full">
          重置连接
        </Button>
      )}
    </div>
  );
}
