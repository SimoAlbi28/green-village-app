interface HeaderProps {
  title?: string
  subtitle?: string
  titleTop?: string
  titleBottom?: string
}

export default function Header({ title = 'MARONCELLI PALAZZINA G', subtitle = '', titleTop, titleBottom }: HeaderProps) {
  return (
    <header id="header">
      <h1>
        {titleTop
          ? <><span className="header-title-gold">{titleTop}</span><span className="header-title-white">{titleBottom}</span></>
          : <>{title}{subtitle && <><br />{subtitle}</>}</>
        }
      </h1>
    </header>
  )
}
