const useUser = () => {
  const getUserFirstName = () => {
    return localStorage.getItem("firstname");
  };
  const getUserLastName = () => {
    return localStorage.getItem("lastname");
  };
  const getUserFullName = () => {
    return (
      localStorage.getItem("firstname") + " " + localStorage.getItem("lastname")
    );
  };

  const getUserEmail = () => {
    return localStorage.getItem("user_email");
  };
  const getUserId = () => {
    return localStorage.getItem("user_id");
  };
  const getUserGender = () => {
    return localStorage.getItem("user_gender");
  };
  const getUserName = () => {
    return localStorage.getItem("user_name");
  };
  return {
    getUserFirstName,
    getUserLastName,
    getUserFullName,
    getUserId,
    getUserEmail,
    getUserGender,
    getUserName,
  };
};

export default useUser;
