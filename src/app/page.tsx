import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <div className="flex flex-col gap-3">
      <Navbar username="Nakul" />
      <div className="p-3">
        <div className="flex items-center justify-center bg-blue-400 h-17 rounded-2xl text-2xl">
          LUNCH orders closes on 11:30 PM
        </div>
        <section>
          <article>
            
          </article>
        </section>
      </div>
    </div>
  );
}
