import Webflow from "@/public/images/webflow.svg";
import Wordpress from "@/public/images/wordpress.svg";
import Image from "next/image";

export default function Logos() {
  return (
    <div className="md:py-8">
      <div className="mx-auto max-w-3xl pb-3 text-center md:pb-4">
        <p className="text-lg text-gray-700">Native integration with</p>
      </div>
      <div>
        <div className="flex flex-wrap items-center justify-center text-gray-600">
          <div className="relative px-6 before:absolute before:left-0 before:top-1/2 before:h-3 before:w-px before:-translate-y-1/2 before:bg-gray-300 first:before:hidden max-lg:before:hidden lg:px-12">
            <Image
              className="pb-4"
              src={Wordpress}
              width={100}
              alt="Wordpress"
            />
          </div>
          <div className="relative px-6 before:absolute before:left-0 before:top-1/2 before:h-3 before:w-px before:-translate-y-1/2 before:bg-gray-300 first:before:hidden max-lg:before:hidden lg:px-12">
            <Image src={Webflow} width={100} alt="Webflow" />
          </div>
          {/* <div className="relative px-6 before:absolute before:left-0 before:top-1/2 before:h-3 before:w-px before:-translate-y-1/2 before:bg-gray-300 first:before:hidden first:before:w-0 max-lg:before:hidden lg:px-12">
            <Image src={Ghost} width={130} alt="Ghost" />
          </div>
          <div className="relative px-6 before:absolute before:left-0 before:top-1/2 before:h-3 before:w-px before:-translate-y-1/2 before:bg-gray-300 first:before:hidden first:before:w-0 max-lg:before:hidden lg:px-12">
            <Image src={Beehiiv} width={100} alt="Beehiiv" />
          </div> */}
        </div>
      </div>
    </div>
  );
}
