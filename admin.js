"use strict";

/* =========================================
   B07 PORTFOLIO
   Admin Login
========================================= */

const SUPABASE_URL =
  "https://vzmrdfyxzjbrgbcgydbb.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_lMrhyGww4C8LZW9Db4_Puw_35HXrOJC";


/* =========================================
   SUPABASE CLIENT
========================================= */

if (
  !window.supabase ||
  typeof window.supabase.createClient !== "function"
) {
  throw new Error("Supabase library is not loaded.");
}


const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "b07-supabase-auth"
      }
    }
  );


/* =========================================
   ELEMENTS
========================================= */

const loginForm =
  document.getElementById("login-form");

const loginMessage =
  document.getElementById("login-message");

const emailInput =
  document.getElementById("email");

const passwordInput =
  document.getElementById("password");


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

  loginMessage.textContent = text;

  loginMessage.setAttribute(
    "data-error",
    isError ? "true" : "false"
  );
}


/* =========================================
   CHECK SESSION
========================================= */

async function checkExistingSession() {
  try {
    const {
      data,
      error
    } =
      await supabaseClient.auth.getSession();

    if (error) {
      console.error(
        "Session check error:",
        error
      );

      return;
    }

    if (data && data.session) {
      window.location.replace(
        "admin-dashboard.html"
      );
    }

  } catch (error) {
    console.error(
      "Session check failed:",
      error
    );
  }
}


/* =========================================
   LOGIN
========================================= */

if (loginForm) {

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


          if (
            error.message ===
            "Invalid login credentials"
          ) {

            setLoginMessage(
              "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
              true
            );

          } else {

            setLoginMessage(
              `تعذر تسجيل الدخول: ${error.message}`,
              true
            );

          }


          if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = "دخول";
          }

          return;
        }


        if (
          !data ||
          !data.session ||
          !data.user
        ) {

          setLoginMessage(
            "تم تسجيل الدخول لكن لم يتم إنشاء جلسة.",
            true
          );


          if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = "دخول";
          }

          return;
        }


        /*
          التأكد من أن الجلسة محفوظة
          قبل الانتقال إلى لوحة التحكم.
        */

        const {
          data: sessionData,
          error: sessionError
        } =
          await supabaseClient.auth.getSession();


        if (
          sessionError ||
          !sessionData ||
          !sessionData.session
        ) {

          console.error(
            "Session was not persisted:",
            sessionError
          );


          setLoginMessage(
            "تم تسجيل الدخول لكن تعذر حفظ الجلسة.",
            true
          );


          if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = "دخول";
          }

          return;
        }


        setLoginMessage(
          "تم تسجيل الدخول بنجاح."
        );


        /*
          نعطي Supabase لحظة لحفظ الجلسة
          في localStorage قبل الانتقال.
        */

        await new Promise(
          resolve =>
            setTimeout(resolve, 300)
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
          error && error.message
            ? `حدث خطأ: ${error.message}`
            : "حدث خطأ أثناء تسجيل الدخول.",
          true
        );


        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = "دخول";
        }

      }

    }
  );

}


/* =========================================
   START
========================================= */

checkExistingSession();
fetch(
  `${SUPABASE_URL}/auth/v1/settings`,
  {
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY
    }
  }
)
  .then(response => response.text())
  .then(result => {
    console.log("SUPABASE TEST:", result);
  })
  .catch(error => {
    console.error("SUPABASE TEST FAILED:", error);
  });
