import { useEffect } from 'react';
import { NextRouter, useRouter } from 'next/router';
import Cookies from 'js-cookie';
import { PreviewResponse } from '@prismicio/client/types/ResolvedApi';
import { repoName } from './prismicConfiguration';

interface RouterPrismic extends NextRouter {
  isPreview?: boolean;
}

function getExitPreviewRoute(router: NextRouter): string {
  const defaultPreviewExitUrl = '/api/exit-preview';
  const linkUrl = router.asPath
    ? `${defaultPreviewExitUrl}?currentUrl=${router.asPath}`
    : defaultPreviewExitUrl;
  return linkUrl;
}

function timeout(ms: number): Promise<unknown> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function useUpdatePreview(
  previewRef: PreviewResponse,
  documentId: string
): void {
  const router: RouterPrismic = useRouter();
  const previewExitRoute = getExitPreviewRoute(router);
  useEffect(() => {
    const updatePreview = async (): Promise<boolean> => {
      await timeout(1000);

      const rawPreviewCookie = Cookies.get('io.prismic.preview');
      const previewCookie = rawPreviewCookie
        ? JSON.parse(rawPreviewCookie)
        : null;

      const previewCookieObject = previewCookie
        ? previewCookie[`${repoName}.prismic.io`]
        : null;

      const previewCookieRef =
        previewCookieObject && previewCookieObject.preview
          ? previewCookieObject.preview
          : null;

      if (router.isPreview) {
        if (rawPreviewCookie && previewCookieRef) {
          if (previewRef !== previewCookieRef) {
            return router.push(
              `/api/preview?token=${previewCookieRef}&documentId=${documentId}`
            );
          }
        } else {
          return router.push(previewExitRoute);
        }
      } else if (rawPreviewCookie && previewCookieRef) {
        return router.push(
          `/api/preview?token=${previewCookieRef}&documentId=${documentId}`
        );
      }
      return undefined;
    };
    updatePreview();
  }, []);
}
