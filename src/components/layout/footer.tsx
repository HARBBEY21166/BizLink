export default function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background/95">
      <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} BizLink. All rights reserved.</p>
        <p>Connecting Entrepreneurs and Investors for a Brighter Future.</p>
      </div>
    </footer>
  );
}
