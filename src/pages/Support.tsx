import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Mail, MessageSquare, Book, HelpCircle, Phone, Youtube, FileText, Shield, Zap, Clock, CheckCircle, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Support = () => {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleOpenAuth = (isLogin: boolean) => {
    navigate("/auth", { state: { isLogin } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navigation user={user} onLogout={handleLogout} onOpenAuth={handleOpenAuth} />
      
      <main className="container mx-auto px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">Support Center</h1>
            <p className="text-xl text-muted-foreground">
              We're here to help you with any questions or issues
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <Badge variant="outline" className="gap-1">
                <CheckCircle className="w-3 h-3 text-green-500" />
                All Systems Operational
              </Badge>
            </div>
          </div>

          {/* Contact Methods */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Email Support</CardTitle>
                <CardDescription>
                  Response within 24 hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" asChild>
                  <a href="mailto:support@ultrapress.com">
                    Send Email
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <MessageSquare className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Live Chat</CardTitle>
                <CardDescription>
                  Available 9AM - 6PM EST
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Start Chat
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Phone className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Phone Support</CardTitle>
                <CardDescription>
                  Mon-Fri 9AM - 6PM EST
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" asChild>
                  <a href="tel:+1-800-123-4567">
                    Call Us
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Resources */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Resources</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                    <Book className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Documentation</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Comprehensive guides and API references
                  </p>
                  <Button variant="ghost" size="sm" className="w-full">
                    View Docs
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                    <Youtube className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Video Tutorials</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Step-by-step video guides
                  </p>
                  <Button variant="ghost" size="sm" className="w-full">
                    Watch Videos
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Blog Articles</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Tips, tricks, and best practices
                  </p>
                  <Button variant="ghost" size="sm" className="w-full">
                    Read Blog
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Community Forum</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Connect with other users
                  </p>
                  <Button variant="ghost" size="sm" className="w-full">
                    Join Forum
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator className="my-12" />

          {/* FAQ Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Frequently Asked Questions</h2>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <HelpCircle className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <CardTitle className="text-lg">How does the compression work?</CardTitle>
                      <CardDescription className="mt-2">
                        Our compression algorithm uses a tree-based approach similar to Huffman coding, 
                        combined with dictionary encoding to identify and compress repetitive patterns in your data. 
                        This ensures optimal compression ratios while maintaining data integrity.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <CardTitle className="text-lg">Is my data secure?</CardTitle>
                      <CardDescription className="mt-2">
                        Yes, all your data is encrypted using industry-standard encryption (AES-256) 
                        both in transit and at rest. Only you have access to your compression history 
                        and files. We implement Row Level Security (RLS) policies to ensure data isolation 
                        between users.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <CardTitle className="text-lg">What file types are supported?</CardTitle>
                      <CardDescription className="mt-2">
                        We support text files including .txt, .csv, .json, .xml, .log, .md, and other 
                        text-based formats. Binary files are not currently supported but are on our roadmap.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <Zap className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <CardTitle className="text-lg">What are the file size limits?</CardTitle>
                      <CardDescription className="mt-2">
                        Free users can compress files up to 10MB. Pro users have a 100MB limit per file. 
                        For larger files, please contact our support team for enterprise solutions.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <CardTitle className="text-lg">How long is my compression history stored?</CardTitle>
                      <CardDescription className="mt-2">
                        Your compression history is stored indefinitely on our secure servers. You can 
                        delete individual entries at any time from your history page. We recommend regularly 
                        backing up important compressed files.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <CardTitle className="text-lg">Can I download compressed files?</CardTitle>
                      <CardDescription className="mt-2">
                        Currently, you can view your compression results and history in the dashboard. 
                        Download functionality for compressed files is coming soon in our next major update!
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </div>
          </div>

          <Separator className="my-12" />

          {/* Additional Help Section */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Still Need Help?</CardTitle>
              <CardDescription className="text-base">
                Our support team is ready to assist you with any questions or issues
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <a href="mailto:support@ultrapress.com">
                  Contact Support
                </a>
              </Button>
              <Button size="lg" variant="outline">
                Schedule a Call
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Support;
