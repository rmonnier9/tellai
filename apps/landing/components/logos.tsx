import Framer from '@/public/images/framer.svg';
import Ghost from '@/public/images/ghost.svg';
import Notion from '@/public/images/notion.svg';
import Plus from '@/public/images/plus.svg';
import Shopify from '@/public/images/shopify.svg';
import Webflow from '@/public/images/webflow.svg';
import Wix from '@/public/images/wix.svg';
import Wordpress from '@/public/images/wordpress.svg';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

export default function Logos() {
  const t = useTranslations('logos');

  return (
    <div className="md:py-8">
      <div>
        <div className="flex flex-wrap items-center justify-center text-gray-600 gap-y-6 lg:gap-y-0">
          <div className="relative px-6 py-3 lg:py-0 before:absolute before:left-0 before:top-1/2 before:h-3 before:w-px before:-translate-y-1/2 before:bg-gray-300 first:before:hidden max-lg:before:hidden lg:px-12">
            <Image
              className="pb-4"
              src={Wordpress}
              width={100}
              alt="Wordpress"
            />
          </div>
          <div className="relative px-6 py-3 lg:py-0 before:absolute before:left-0 before:top-1/2 before:h-3 before:w-px before:-translate-y-1/2 before:bg-gray-300 first:before:hidden max-lg:before:hidden lg:px-12">
            <Image src={Webflow} width={100} alt="Webflow" />
          </div>
          <div className="relative px-6 py-3 lg:py-0 before:absolute before:left-0 before:top-1/2 before:h-3 before:w-px before:-translate-y-1/2 before:bg-gray-300 first:before:hidden max-lg:before:hidden lg:px-12">
            <Image src={Framer} width={100} alt="Framer" />
          </div>
          <div className="relative px-6 py-3 lg:py-0 before:absolute before:left-0 before:top-1/2 before:h-3 before:w-px before:-translate-y-1/2 before:bg-gray-300 first:before:hidden max-lg:before:hidden lg:px-12">
            <Image src={Shopify} width={100} alt="Shopify" />
          </div>
          <div className="relative px-6 py-3 lg:py-0 before:absolute before:left-0 before:top-1/2 before:h-3 before:w-px before:-translate-y-1/2 before:bg-gray-300 first:before:hidden max-lg:before:hidden lg:px-12">
            <Image src={Wix} width={60} alt="Wix" />
          </div>
          <div className="relative px-6 py-3 lg:py-0 before:absolute before:left-0 before:top-1/2 before:h-3 before:w-px before:-translate-y-1/2 before:bg-gray-300 first:before:hidden max-lg:before:hidden lg:px-12">
            <Image src={Notion} width={40} alt="Notion" />
          </div>
          <div className="relative px-6 py-3 lg:py-0 before:absolute before:left-0 before:top-1/2 before:h-3 before:w-px before:-translate-y-1/2 before:bg-gray-300 first:before:hidden first:before:w-0 max-lg:before:hidden lg:px-12">
            <Image src={Ghost} width={130} alt="Ghost" />
          </div>
          <div className="relative px-3 sm:px-6 py-3 lg:py-0 before:absolute before:left-0 before:top-1/2 before:h-3 before:w-px before:-translate-y-1/2 before:bg-gray-300 first:before:hidden max-lg:before:hidden lg:px-12">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center flex-shrink-0">
                <Image
                  src={Plus}
                  width={32}
                  height={32}
                  alt="Custom Integration"
                  className="w-full h-full"
                />
              </div>
              <span className="text-sm sm:text-base font-medium text-gray-600 whitespace-nowrap">
                {t('customIntegration')}
              </span>
            </div>
          </div>

          {/* <div className="relative px-6 before:absolute before:left-0 before:top-1/2 before:h-3 before:w-px before:-translate-y-1/2 before:bg-gray-300 first:before:hidden first:before:w-0 max-lg:before:hidden lg:px-12">
            <Image src={Beehiiv} width={100} alt="Beehiiv" />
          </div> */}
        </div>
      </div>
    </div>
  );
}
