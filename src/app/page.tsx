import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Users, MessageSquare, Brain, FileText } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const features = [
  {
    icon: <Users className="h-8 w-8 text-primary" />,
    title: 'Connect & Network',
    description: 'Find entrepreneurs seeking funding or investors looking for the next big thing. Tailor your search to your interests.',
  },
  {
    icon: <FileText className="h-8 w-8 text-primary" />,
    title: 'Seamless Collaboration',
    description: 'Send and manage collaboration requests with ease. Keep track of your potential partnerships.',
  },
  {
    icon: <MessageSquare className="h-8 w-8 text-primary" />,
    title: 'Real-Time Chat',
    description: 'Communicate directly with your connections through our integrated real-time messaging system.',
  },
  {
    icon: <Brain className="h-8 w-8 text-primary" />,
    title: 'AI Pitch Analyzer',
    description: 'Get instant feedback on your pitch deck with our AI-powered analysis tool. Improve your pitch and increase your chances of success.',
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full py-20 md:py-32 bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container mx-auto text-center px-4">
          <h1 className="font-headline text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Welcome to <span className="text-primary">BizLink</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            The premier platform connecting innovative entrepreneurs with visionary investors.
            Unlock opportunities, build partnerships, and fuel growth.
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild size="lg" className="font-semibold">
              <Link href="/register">Get Started</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="font-semibold border-primary text-primary hover:bg-primary/10 hover:text-primary">
              <Link href="/#features">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24 w-full">
        <div className="container mx-auto px-4">
          <h2 className="font-headline text-3xl md:text-4xl font-bold text-center mb-12">
            How <span className="text-primary">BizLink</span> Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center p-6 bg-card rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="p-4 bg-primary/20 rounded-full mb-4">
                <Users className="h-10 w-10 text-primary" />
              </div>
              <h3 className="font-headline text-xl font-semibold mb-2">1. Create Your Profile</h3>
              <p className="text-muted-foreground">Sign up as an Entrepreneur or Investor and build a compelling profile to showcase your vision or investment focus.</p>
            </div>
            <div className="flex flex-col items-center p-6 bg-card rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="p-4 bg-primary/20 rounded-full mb-4">
                <CheckCircle className="h-10 w-10 text-primary" />
              </div>
              <h3 className="font-headline text-xl font-semibold mb-2">2. Discover & Connect</h3>
              <p className="text-muted-foreground">Browse profiles, find promising startups or strategic investors, and send collaboration requests.</p>
            </div>
            <div className="flex flex-col items-center p-6 bg-card rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="p-4 bg-primary/20 rounded-full mb-4">
                <MessageSquare className="h-10 w-10 text-primary" />
              </div>
              <h3 className="font-headline text-xl font-semibold mb-2">3. Collaborate & Grow</h3>
              <p className="text-muted-foreground">Use our real-time chat to discuss opportunities and build successful partnerships.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section id="features" className="py-16 md:py-24 w-full bg-primary/5">
        <div className="container mx-auto px-4">
          <h2 className="font-headline text-3xl md:text-4xl font-bold text-center mb-16">
            Platform <span className="text-primary">Features</span>
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-card hover:shadow-xl transition-shadow duration-300 ease-in-out">
                <CardHeader className="items-center">
                  <div className="p-3 bg-primary/10 rounded-full mb-2">
                    {feature.icon}
                  </div>
                  <CardTitle className="font-headline text-xl text-center">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 md:py-24 w-full">
        <div className="container mx-auto text-center px-4">
          <h2 className="font-headline text-3xl md:text-4xl font-bold mb-6">
            Ready to <span className="text-primary">Elevate</span> Your Business?
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
            Join BizLink today and become part of a dynamic network of innovators and investors.
          </p>
          <Button asChild size="lg" className="font-semibold text-lg px-8 py-6">
            <Link href="/register">Join BizLink Now</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
