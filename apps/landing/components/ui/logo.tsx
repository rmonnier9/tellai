import Lovarank from "@/public/images/lovarank.png";
import Image from "next/image";
import Link from "next/link";

export default function Logo() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2"
      aria-label="Lovarank"
    >
      <div className="-rotate-15">
        <Image src={Lovarank} width={28} height={28} alt="lovarank logo" />
      </div>
      <span className="font-bricolage font-bold text-lg ">Lovarank</span>
    </Link>
  );
}
