export function sanitizeUser(user: any) {
  if (!user) return null;
  const { passwordHash, mfaSecretEncrypted, mfaRecoveryCodesEncrypted, ...safeUser } = user;
  return safeUser;
}

export function sanitizeFacebookPage(page: any) {
  if (!page) return null;
  const { encryptedAccessToken, ...safePage } = page;
  return safePage;
}

export function sanitizePublication(publication: any) {
  if (!publication) return null;
  const { facebookPage, ...rest } = publication;
  return {
    ...rest,
    facebookPage: facebookPage ? sanitizeFacebookPage(facebookPage) : undefined,
  };
}

export function sanitizePost(post: any) {
  if (!post) return null;
  const { publications, ...rest } = post;
  return {
    ...rest,
    publications: Array.isArray(publications)
      ? publications.map(sanitizePublication)
      : undefined,
  };
}
