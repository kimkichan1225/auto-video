// 목업 대본 생성기 — Phase 7에서 Gemini 호출로 교체
export function generateMockScript(productName: string, description: string): string {
  const name = productName.trim() || "이 제품";
  const desc = description.trim();

  return `안녕하세요! 오늘은 ${name}에 대해 소개해드리려고 합니다.

${desc ? `${desc}\n\n` : ""}${name}의 가장 큰 장점은 바로 실사용자들이 체감하는 만족도에 있습니다. 다른 제품들과 차별화되는 핵심 가치를 직접 경험해보실 수 있죠.

특히 주목할 점은, 단순한 스펙 나열이 아니라 일상에서 어떻게 쓰이는지에 초점을 맞춘다는 것입니다.

마지막으로 강조하고 싶은 건, ${name}이 단순한 제품이 아니라 여러분의 일상을 한 단계 바꿀 수 있는 솔루션이라는 점입니다.

이상으로 ${name} 소개를 마치겠습니다. 감사합니다!`;
}
