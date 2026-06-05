export function Footer() {
  return (
    <footer className="border-t border-border py-4 px-6 text-center text-sm text-muted-foreground">
      <p>
        Gool &copy; {new Date().getFullYear()} &middot;
        纯前端，无需登录，数据不离开浏览器
      </p>
    </footer>
  );
}
