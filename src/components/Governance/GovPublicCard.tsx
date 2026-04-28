import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface GovPublicCardProps {
  symbol?: string;
  className?: string;
}

const GovPublicCard: React.FC<GovPublicCardProps> = ({ symbol, className = '' }) => {
  return (
    <div className={className}>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">治理公示</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-8 justify-center text-sm">
            <Button className="w-1/2 text-secondary border-secondary" asChild variant="outline">
              <Link href={`/vote/actions/?symbol=${symbol}`}>投票中的行动 &gt;&gt;</Link>
            </Button>
            <Button className="w-1/2 text-secondary border-secondary" asChild variant="outline">
              <Link href={`/verify/actions/?symbol=${symbol}`}>验证中的行动 &gt;&gt;</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GovPublicCard;
