"use strict";

const SUPABASE_URL =
  "https://vzmrdfyxzjbrgbcgydbb.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_lMrhyGww4C8LZW9Db4_Puw_35HXrOJC";


/* =========================================
   SUPABASE
========================================= */

if (
  !window.supabase ||
  typeof window.supabase.createClient !== "function"
) {

  console.error(
    "Supabase library is not loaded."
  );

  const message =
    document.getElementById(
      "login-message"
    );

  if (message) {
    message.textContent =
      "تعذر تحميل نظام تسجيل الدخول. أعد تحميل الصفحة.";
  }

  throw new Error(
    "Supabase library is not loaded."
  );
}


const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );


/* =========================================
   ELEMENTS
========================================= */

const loginForm =
  document.getElementById(
    "login-form"
  );

const loginMessage =
  document.getElementById(
    "login-message"
  );

const emailInput =
  document.getElementById(
    "email"
  );

const passwordInput =
  document.getElementById(
    "password"
  );


/* =========================================
   MESSAGE
========================================= */

function setLoginMessage(
  text,
  isError = false
) {

  if (!loginMessage) {
    return;
  }

  loginMessage.textContent =
    text;

  loginMessage.setAttribute(
    "data-error",
    isError ? "true" : "false"
  );

}


/* =========================================
   CHECK EXISTING SESSION
========================================= */

async function checkExistingSession() {

  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth.getSession();


    if (error) {
      throw error;
    }


    if (
      data &&
      data.session
    ) {

      window.location.replace(
        "admin-dashboard.html"
      );

    }

  }

  catch (error) {

    console.error(
      "Session check error:",
      error
    );

  }

}


/* =========================================
   LOGIN
========================================= */

if (!loginForm) {

  console.error(
    "Login form not found."
  );

}
else {

  loginForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      const email =
        emailInput
          ? emailInput.value.trim()
          : "";

      const password =
        passwordInput
          ? passwordInput.value
          : "";


      if (!email) {

        setLoginMessage(
          "أدخل البريد الإلكتروني.",
          true
        );

        return;
      }


      if (!password) {

        setLoginMessage(
          "أدخل كلمة المرور.",
          true
        );

        return;
      }


      const submitButton =
        loginForm.querySelector(
          'button[type="submit"]'
        );


      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent =
          "جاري الدخول...";
      }


      setLoginMessage(
        "جاري تسجيل الدخول..."
      );


      try {

        const {
          data,
          error
        } =
          await supabaseClient.auth.signInWithPassword({
            email,
            password
          });


        if (error) {

          console.error(
            "Supabase login error:",
            error
          );


          let message =
            "تعذر تسجيل الدخول.";


          if (
            error.message ===
            "Invalid login credentials"
          ) {

            message =
              "البريد الإلكتروني أو كلمة المرور غير صحيحة.";

          }
          else if (
            error.message
          ) {

            message =
              `تعذر تسجيل الدخول: ${error.message}`;

          }


          setLoginMessage(
            message,
            true
          );


          if (submitButton) {

            submitButton.disabled =
              false;

            submitButton.textContent =
              "دخول";

          }

          return;
        }


        if (
          !data ||
          !data.session
        ) {

          setLoginMessage(
            "تمت محاولة تسجيل الدخول لكن لم يتم إنشاء جلسة.",
            true
          );


          if (submitButton) {

            submitButton.disabled =
              false;

            submitButton.textContent =
              "دخول";

          }

          return;
        }


        setLoginMessage(
          "تم تسجيل الدخول بنجاح."
        );


        window.location.replace(
          "admin-dashboard.html"
        );

      }

      catch (error) {

        console.error(
          "Login request failed:",
          error
        );


        setLoginMessage(
          error.message
            ? `حدث خطأ: ${error.message}`
            : "حدث خطأ أثناء تسجيل الدخول.",
          true
        );


        if (submitButton) {

          submitButton.disabled =
            false;

          submitButton.textContent =
            "دخول";

        }

      }

    }
  );

}


/* =========================================
   START
========================================= */

checkExistingSession();
