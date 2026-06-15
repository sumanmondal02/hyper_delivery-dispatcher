import * as S from '../styles/common';

export function Spinner({ large = false }) {
  return (
    <div className={S.loadingCenter}>
      <div className={large ? S.spinnerLg : S.spinner} />
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className={S.cardPadded}>
      <div className={`${S.skeleton} h-5 w-2/3 mb-3`} />
      <div className={`${S.skeletonText} w-full mb-2`} />
      <div className={`${S.skeletonText} w-4/5`} />
    </div>
  );
}