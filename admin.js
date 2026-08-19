"use strict";

const SUPABASE_URL =
  "https://vzmrdfyxzjbrgbcgydbb.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_lMrhyGww4C8LZW9Db4_Puw_35HXrOJC";


const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );


const loginForm =
  document.getElementById("login-form");

const loginMessage =
  document.getElementById("login-message");


loginForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    const email =
      document.getElementById("email").value.trim();

    const password =
      document.getElementById("password").value;


    loginMessage.textContent =
      "جاري تسجيل الدخول...";


    const { error } =
      await supabaseClient.auth.signInWithPassword({
        email,
        password
      });


    if (error) {

      console.error(error);

      loginMessage.textContent =
        "بيانات الدخول غير صحيحة أو حدث خطأ.";

      return;
    }


    loginMessage.textContent =
      "تم تسجيل الدخول بنجاح.";


    window.location.href =
      "admin-dashboard.html";

  }
);
