import AOSInit from '@/components/ui/aos-init';
import Footer from '@/components/ui/footer';
import HeaderWrapper from '@/components/ui/header-wrapper';

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AOSInit />
      <HeaderWrapper />

      <main className="grow">{children}</main>

      <Footer border={true} />
    </>
  );
}
