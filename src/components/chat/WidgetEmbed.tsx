'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function WidgetEmbed() {
    const [copied, setCopied] = useState(false);

    const embedCode = `<script>
  (function(d,t) {
    var BASE_URL="https://n8n-chatwoot.pqcilq.easypanel.host";
    var g=d.createElement(t),s=d.getElementsByTagName(t)[0];
    g.src=BASE_URL+"/packs/js/sdk.js";
    g.async = true;
    s.parentNode.insertBefore(g,s);
    g.onload=function(){
      window.chatwootSDK.run({
        websiteToken: 'gMjZm1k65JfcSdvkL4WLgdif',
        baseUrl: BASE_URL
      })
    }
  })(document,"script");
</script>`;

    const handleCopy = () => {
        navigator.clipboard.writeText(embedCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Card className="w-full max-w-3xl mx-auto mt-8 border-primary/20 shadow-md">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-2xl font-bold text-primary">Instalar Widget</CardTitle>
                        <CardDescription>
                            Copie o código abaixo e cole antes do fechamento da tag &lt;/body&gt; do seu site.
                        </CardDescription>
                    </div>
                    <Button
                        onClick={handleCopy}
                        variant="outline"
                        size="sm"
                        className="gap-2 border-primary/20 hover:bg-primary/5 hover:text-primary transition-all duration-300"
                    >
                        {copied ? (
                            <>
                                <Check className="h-4 w-4" />
                                Copiado!
                            </>
                        ) : (
                            <>
                                <Copy className="h-4 w-4" />
                                Copiar Código
                            </>
                        )}
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="relative rounded-lg overflow-hidden bg-slate-950 border border-slate-800">
                    <div className="absolute top-0 right-0 p-2">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-500/50" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                            <div className="w-3 h-3 rounded-full bg-green-500/50" />
                        </div>
                    </div>
                    <div className="p-4 pt-8 overflow-x-auto">
                        <pre className="font-mono text-sm text-slate-300">
                            <code>{embedCode}</code>
                        </pre>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
