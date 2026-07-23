export default function LogoWall() {
  const logos = [
    { name: 'Stanford', url: 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Stanford_University_seal_2003.svg' },
    { name: 'MIT', url: 'https://upload.wikimedia.org/wikipedia/commons/0/0c/MIT_logo.svg' },
    { name: 'Harvard', url: 'https://upload.wikimedia.org/wikipedia/commons/7/70/Harvard_University_logo.svg' },
    { name: 'Oxford', url: 'https://upload.wikimedia.org/wikipedia/commons/7/71/University_of_Oxford_coat_of_arms.svg' },
    { name: 'Cambridge', url: 'https://upload.wikimedia.org/wikipedia/commons/c/c3/Coat_of_Arms_of_the_University_of_Cambridge.svg' },
  ];

  return (
    <section className="py-16 bg-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-8">
          Trusted by Top Universities & Enterprises Worldwide
        </p>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
          {logos.map((logo, i) => (
            <div key={i} className="flex items-center justify-center w-24 h-12 md:w-32 md:h-16 relative">
              <img src={logo.url} alt={logo.name} className="max-h-full max-w-full object-contain filter brightness-0 opacity-70 hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
