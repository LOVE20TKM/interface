import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface GovernorIntroCardProps {
  symbol?: string;
  className?: string;
}

const GovernorIntroCard: React.FC<GovernorIntroCardProps> = ({ symbol, className = "mt-4" }) => {
  const submitThreshold = Number(process.env.NEXT_PUBLIC_SUBMIT_MIN_PER_THOUSAND ?? 0) / 10;
  const voteThreshold = Number(process.env.NEXT_PUBLIC_ACTION_REWARD_MIN_VOTE_PER_THOUSAND ?? 0) / 10;

  return (
    <Card className={cn("w-full border-greyscale-200 shadow-sm", className)}>
      <CardHeader className="px-4 pt-4 pb-2">
        <CardTitle className="text-lg font-bold text-greyscale-800">治理票的作用</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0 text-sm leading-6 text-greyscale-600">
        <li className="list-disc list-inside"> 持有治理票的成为社区的真正主人，决定社区未来的发展方向。</li>
        <li className="list-disc list-inside">每轮获得{voteThreshold}% 以上投票支持的行动，有行动铸币激励。</li>
        <li className="list-disc list-inside">
          有 {submitThreshold}%的治理票，每轮可推举一个新/老行动到本轮的投票列表。
        </li>
      </CardContent>
    </Card>
  );
};

export default GovernorIntroCard;
