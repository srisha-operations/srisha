const GallerySection = () => {
  return (
    <section className="w-full p-8">
      <div className="container mx-auto">
        <h2 className="text-xl mb-4">Gallery Section</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
            <div
              key={item}
              className="w-full h-[200px] flex items-center justify-center border"
            >
              Gallery Item {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GallerySection;
