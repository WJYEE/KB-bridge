"use client";

import { useEffect } from "react";
import { Button, LinkButton } from "@/components/ui/Button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // 실제 에러는 서버/브라우저 콘솔에만 남기고, 사용자에게는 기술적 메시지를 노출하지 않는다.
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <p className="text-lg font-bold text-navy">일시적인 오류가 발생했습니다</p>
      <p className="text-sm text-slate-500">
        잠시 후 다시 시도해주세요. 문제가 계속되면 처음부터 다시 입력해주세요.
      </p>
      <div className="mt-2 flex gap-2">
        <Button onClick={reset}>다시 시도</Button>
        <LinkButton href="/" variant="secondary">
          처음으로
        </LinkButton>
      </div>
    </div>
  );
}
