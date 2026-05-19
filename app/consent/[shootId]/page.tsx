import ConsentForm from "@/components/ConsentForm";

interface PageProps {
  params: Promise<{ shootId: string }>;
}

export default async function ConsentPage({ params }: PageProps) {
  const { shootId } = await params;
  return <ConsentForm shootId={shootId} />;
}
