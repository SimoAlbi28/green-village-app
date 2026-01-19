interface HeaderProps {
  title?: string
  subtitle?: string
}

export default function Header({ title = 'HOME PAGE', subtitle = 'MANUTENZIONI' }: HeaderProps) {
  return (
    <header id="header">
      <h1>{title}<br />{subtitle}</h1>
    </header>
  )
}
