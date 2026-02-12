'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '@ccd/ui';
import { CheckCircle, Loader2, AlertCircle, FileText, Eraser } from 'lucide-react';

type SignState = 'loading' | 'ready' | 'signing' | 'success' | 'error' | 'no_token';

export default function ContractSignPage({ params }: { params: { token: string } }) {
  const { token } = params;
  const [state, setState] = React.useState<SignState>(token ? 'loading' : 'no_token');
  const [error, setError] = React.useState('');
  const [contract, setContract] = React.useState<any>(null);
  const [employee, setEmployee] = React.useState<any>(null);
  const [signMethod, setSignMethod] = React.useState<'draw' | 'type'>('draw');
  const [typedName, setTypedName] = React.useState('');
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const isDrawing = React.useRef(false);
  const hasVerified = React.useRef(false);

  // Verify token on mount
  React.useEffect(() => {
    if (!token || hasVerified.current) return;
    hasVerified.current = true;

    async function verify() {
      try {
        const res = await fetch('/api/hr/sign/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          setState('error');
          setError(data.error?.message || 'Invalid or expired signing link');
          return;
        }
        setContract(data.data.contract);
        setEmployee(data.data.employee);
        setState('ready');
      } catch {
        setState('error');
        setError('Failed to verify signing link');
      }
    }
    verify();
  }, [token]);

  // Canvas drawing setup
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const getPos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      if ('touches' in e) {
        return {
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top,
        };
      }
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const startDraw = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      isDrawing.current = true;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    };

    const draw = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      if (!isDrawing.current) return;
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    };

    const stopDraw = () => {
      isDrawing.current = false;
    };

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDraw);
    canvas.addEventListener('mouseleave', stopDraw);
    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDraw);

    return () => {
      canvas.removeEventListener('mousedown', startDraw);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stopDraw);
      canvas.removeEventListener('mouseleave', stopDraw);
      canvas.removeEventListener('touchstart', startDraw);
      canvas.removeEventListener('touchmove', draw);
      canvas.removeEventListener('touchend', stopDraw);
    };
  }, [state, signMethod]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSign = async () => {
    let signatureData = '';

    if (signMethod === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      signatureData = canvas.toDataURL('image/png');
    } else {
      if (!typedName.trim()) return;
      // Create typed signature as canvas image
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.font = 'italic 32px "Georgia", serif';
      ctx.fillStyle = '#000';
      ctx.fillText(typedName.trim(), 20, 60);
      signatureData = canvas.toDataURL('image/png');
    }

    setState('signing');
    try {
      const res = await fetch('/api/hr/sign/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          signature_data: signatureData,
          signature_method: signMethod,
          typed_name: signMethod === 'type' ? typedName.trim() : null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setState('ready');
        setError(data.error?.message || 'Failed to submit signature');
        return;
      }
      setState('success');
    } catch {
      setState('ready');
      setError('Failed to submit signature');
    }
  };

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (state === 'error' || state === 'no_token') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h2 className="text-lg font-semibold mb-2">
              {state === 'no_token' ? 'Missing Token' : 'Invalid Link'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {error || 'No signing token was provided. Please use the link from your email.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state === 'success') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
            <h2 className="text-lg font-semibold mb-2">Contract Signed Successfully</h2>
            <p className="text-sm text-muted-foreground">
              Your signature has been recorded. You may close this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Ready state — show contract + signature area
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Review & Sign Contract</h1>
          {employee && (
            <p className="text-muted-foreground">
              {employee.first_name} {employee.last_name}
            </p>
          )}
        </div>

        {/* Contract Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{contract?.title}</CardTitle>
              <Badge variant="outline">
                {contract?.type === 'employment' ? 'Employment Contract' :
                 contract?.type === 'nda' ? 'NDA' :
                 contract?.type === 'amendment' ? 'Amendment' : 'Contract'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {contract?.file_url ? (
              <div className="border rounded-lg p-6 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-3">PDF Document</p>
                <a href={contract.file_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">View Document</Button>
                </a>
              </div>
            ) : Array.isArray(contract?.content) && contract.content.length > 0 ? (
              <div className="space-y-6">
                {contract.content.map((section: any, idx: number) => (
                  <div key={idx}>
                    {section.title && (
                      <h3 className="font-semibold mb-2">{section.title}</h3>
                    )}
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {section.content}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No content.</p>
            )}
          </CardContent>
        </Card>

        {/* Signature Area */}
        <Card>
          <CardHeader>
            <CardTitle>Your Signature</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Method tabs */}
            <div className="flex gap-2">
              <Button
                variant={signMethod === 'draw' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSignMethod('draw')}
              >
                Draw
              </Button>
              <Button
                variant={signMethod === 'type' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSignMethod('type')}
              >
                Type
              </Button>
            </div>

            {signMethod === 'draw' ? (
              <div>
                <div className="border-2 border-dashed rounded-lg relative" style={{ height: '150px' }}>
                  <canvas
                    ref={canvasRef}
                    className="w-full h-full cursor-crosshair rounded-lg"
                    style={{ touchAction: 'none' }}
                  />
                </div>
                <div className="flex justify-end mt-2">
                  <Button variant="ghost" size="sm" onClick={clearCanvas}>
                    <Eraser className="mr-2 h-4 w-4" />
                    Clear
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  placeholder="Type your full name"
                  className="w-full px-3 py-2 border rounded-md text-lg"
                />
                {typedName && (
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <p className="text-2xl italic font-serif text-gray-700">{typedName}</p>
                  </div>
                )}
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button
              className="w-full"
              size="lg"
              onClick={handleSign}
              disabled={state === 'signing' || (signMethod === 'type' && !typedName.trim())}
            >
              {state === 'signing' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              I Agree and Sign
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
