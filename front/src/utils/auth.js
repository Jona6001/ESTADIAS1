import Swal from "sweetalert2";

let tokenAlertVisible = false;

export const clearSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

export const handleTokenExpired = async (navigate) => {
  if (tokenAlertVisible) return;
  tokenAlertVisible = true;
  clearSession();
  try {
    await Swal.fire({
      title: "Sesión expirada",
      text: "Tu sesión ha expirado. Por seguridad, inicia sesión nuevamente.",
      icon: "warning",
      confirmButtonText: "Ir al inicio",
      confirmButtonColor: "#a30015",
      background: "#fef2f2",
      color: "#7b1531",
    });
  } catch (error) {
    // ignore modal rejection
  } finally {
    try {
      if (typeof navigate === "function") {
        navigate("/");
      } else {
        window.location.assign("/");
      }
    } catch {
      window.location.assign("/");
    } finally {
      tokenAlertVisible = false;
    }
  }
};

export const fetchWithAuth = async (url, navigate, options = {}) => {
  const token = localStorage.getItem("token");
  const headers = {
    Accept: "application/json",
    ...(options.headers || {}),
  };
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401 || response.status === 403) {
    await handleTokenExpired(navigate);
    throw new Error("Sesión expirada");
  }

  return response;
};
