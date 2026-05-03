export function validatePassword(password: string) {
  const minLength = /.{8,}/;
  const upper = /[A-Z]/;
  const lower = /[a-z]/;
  const digit = /[0-9]/;
  const special = /[^A-Za-z0-9]/;

  if (!minLength.test(password)) {
    return "Password must be at least 8 characters long";
  }
  if (!upper.test(password)) {
    return "Password must contain at least one uppercase letter";
  }
  if (!lower.test(password)) {
    return "Password must contain at least one lowercase letter";
  }
  if (!digit.test(password)) {
    return "Password must contain at least one number";
  }
  if (!special.test(password)) {
    return "Password must contain at least one special character";
  }

  return null; // valid
}