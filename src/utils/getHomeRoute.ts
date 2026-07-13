export const getHomeRoute = (
  clinicType: string | null | undefined,
): string => {
  switch (clinicType) {
    case 'dental':
      return '/clinic/dental-home';
    case 'beauty':
      return '/clinic/beauty-home';
    case 'laser':
      return '/clinic/laser-home';
    default:
      return '/clinic/dashboard';
  }
};
