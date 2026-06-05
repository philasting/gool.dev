"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StickyNote, Plus, Trash2, Edit3, Check, X } from "lucide-react";

interface NoteItem {
  id: string;
  name: string;
  content: string;
}

const STORAGE_KEY = "gool-temp-notes";

function loadNotes(): NoteItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [{ id: `note-${Date.now()}`, name: "便签 1", content: "" }];
  } catch {
    return [{ id: `note-${Date.now()}`, name: "便签 1", content: "" }];
  }
}

function saveNotes(notes: NoteItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export function TempNoteTool() {
  const [notes, setNotes] = useState<NoteItem[]>(loadNotes);
  const [activeId, setActiveId] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    if (notes.length > 0 && !activeId) {
      setActiveId(notes[0].id);
    }
  }, [notes, activeId]);

  useEffect(() => {
    saveNotes(notes);
  }, [notes]);

  const activeNote = notes.find((n) => n.id === activeId);

  const addNote = useCallback(() => {
    const id = `note-${Date.now()}`;
    const newNote: NoteItem = { id, name: `便签 ${notes.length + 1}`, content: "" };
    setNotes((prev) => [...prev, newNote]);
    setActiveId(id);
  }, [notes.length]);

  const deleteNote = useCallback(
    (id: string) => {
      setNotes((prev) => {
        const next = prev.filter((n) => n.id !== id);
        if (next.length === 0) {
          const fallback: NoteItem = { id: `note-${Date.now()}`, name: "便签 1", content: "" };
          setActiveId(fallback.id);
          return [fallback];
        }
        if (activeId === id) {
          setActiveId(next[0].id);
        }
        return next;
      });
    },
    [activeId]
  );

  const updateContent = useCallback(
    (content: string) => {
      setNotes((prev) => prev.map((n) => (n.id === activeId ? { ...n, content } : n)));
    },
    [activeId]
  );

  const startRename = useCallback((note: NoteItem) => {
    setEditingId(note.id);
    setEditName(note.name);
  }, []);

  const confirmRename = useCallback(() => {
    if (editingId && editName.trim()) {
      setNotes((prev) =>
        prev.map((n) => (n.id === editingId ? { ...n, name: editName.trim() } : n))
      );
    }
    setEditingId(null);
    setEditName("");
  }, [editingId, editName]);

  const cancelRename = useCallback(() => {
    setEditingId(null);
    setEditName("");
  }, []);

  return (
    <div className="space-y-4">
      {/* Tab bar for notes */}
      <div className="flex items-center gap-2 flex-wrap">
        {notes.map((note) => (
          <div
            key={note.id}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm cursor-pointer transition-colors ${
              activeId === note.id
                ? "border-primary bg-primary/10 text-primary font-medium"
                : "border-border hover:border-primary/30 hover:bg-accent/50"
            }`}
            onClick={() => setActiveId(note.id)}
          >
            {editingId === note.id ? (
              <div className="flex items-center gap-1">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") confirmRename();
                    if (e.key === "Escape") cancelRename();
                  }}
                  className="h-6 w-20 text-xs px-1"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={(e) => {
                    e.stopPropagation();
                    confirmRename();
                  }}
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={(e) => {
                    e.stopPropagation();
                    cancelRename();
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <>
                <StickyNote className="h-3 w-3 shrink-0" />
                <span className="max-w-24 truncate">{note.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 shrink-0 opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    startRename(note);
                  }}
                >
                  <Edit3 className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addNote} className="h-8">
          <Plus className="h-3.5 w-3.5 mr-1" /> 新建
        </Button>
      </div>

      {/* Active note content */}
      {activeNote && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label className="text-base font-semibold">{activeNote.name}</Label>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => startRename(activeNote)}
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </Button>
                {notes.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => deleteNote(activeNote.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
            <textarea
              value={activeNote.content}
              onChange={(e) => updateContent(e.target.value)}
              placeholder="在这里输入内容，自动保存到本地..."
              className="w-full min-h-[300px] resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="text-xs text-muted-foreground">
              内容自动保存到浏览器本地存储
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
