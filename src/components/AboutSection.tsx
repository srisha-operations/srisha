import content from "@/data/content.json";

const AboutSection = () => {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-tenor text-center text-foreground mb-8">
          {content.about.title}
        </h2>
        <p className="text-base md:text-lg font-lato text-muted-foreground text-center max-w-3xl mx-auto leading-relaxed">
          {content.about.body}
        </p>
      </div>
    </section>
  );
};

export default AboutSection;
