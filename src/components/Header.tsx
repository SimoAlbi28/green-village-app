interface HeaderProps {
  title?: string
  subtitle?: string
}

export default function Header({ title = 'MARONCELLI PALAZZINA G', subtitle = '' }: HeaderProps) {
  return (
    <header id="header">
      <h1>{title}{subtitle && <><br />{subtitle}</>}</h1>
    </header>
  )
}
