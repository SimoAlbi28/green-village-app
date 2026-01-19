interface FooterProps {
  githubUrl?: string
}

export default function Footer({ githubUrl = 'https://github.com/SimoAlbi28' }: FooterProps) {
  return (
    <footer className="app-footer">
      <a
        href={githubUrl}
        target="_blank"
        rel="noreferrer noopener"
      >
        GitHub: SimoAlbi28
      </a>
    </footer>
  )
}
