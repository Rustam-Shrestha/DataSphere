// @ts-nocheck
import React, { useEffect, useState, useRef } from "react";

const slides = [
  {
    title: "Secure KYC, simplified",
    subtitle: "Fast, reliable identity verification for your users.",
    color: "from-indigo-500 to-purple-500",
  },
  {
    title: "Automated OCR & Face Match",
    subtitle: "Extract documents and verify faces with confidence.",
    color: "from-green-500 to-teal-500",
  },
  {
    title: "Reports & Audits",
    subtitle: "Exportable audit trails and compliance-ready logs.",
    color: "from-yellow-400 to-orange-500",
  },
];

const HeroSlider = () => {
  const [index, setIndex] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 5000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const goPrev = () => setIndex((i) => (i - 1 + slides.length) % slides.length);
  const goNext = () => setIndex((i) => (i + 1) % slides.length);

  return (
    <section className="w-full rounded-lg overflow-hidden mb-6">
      <div className={`w-full h-56 sm:h-72 flex items-center justify-center bg-gradient-to-r ${slides[index].color}`}>
        <div className="max-w-4xl px-6 text-center text-white">
          <h1 className="text-2xl sm:text-4xl font-bold mb-2">{slides[index].title}</h1>
          <p className="text-sm sm:text-lg opacity-90">{slides[index].subtitle}</p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 mt-3">
        <button type="button" aria-label="Previous slide" onClick={goPrev} className="px-3 py-1 rounded bg-white/10 text-white">Prev</button>
        {slides.map((s, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => setIndex(i)}
            className={`w-2 h-2 rounded-full ${i === index ? "bg-primary" : "bg-gray-300"}`}
          />
        ))}
        <button type="button" aria-label="Next slide" onClick={goNext} className="px-3 py-1 rounded bg-white/10 text-white">Next</button>
      </div>
    </section>
  );
};

export default HeroSlider;
