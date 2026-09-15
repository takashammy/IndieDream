import type { Locale } from "@/lib/locale";

export const UPLOAD_TERMS = {
  en: "You keep the copyright in your music. By uploading a track you let Inner Soul Records and Dreamin' Indie host the file and play or promote it on this platform and at live venues. You can delete a track from the platform at any time.",
  zh: "你保留作品的版權。上載歌曲即表示你允許 Inner Soul Records 及 Dreamin' Indie 在本平台存放檔案，並於平台及現場場地播放或推廣。你可以隨時從平台刪除歌曲。",
} as const;

export const LEGAL_PAGE = {
  en: {
    kicker: "Dreamin' Indie",
    title: "Privacy & terms",
    back: "Back to the app",
    sections: [
      {
        heading: "Who we are",
        body: "Dreamin' Indie is run by Inner Soul Records in Hong Kong. This page covers the account you make here and the songs you upload.",
      },
      {
        heading: "What we store",
        body: "When you register or update your profile we store your name, username, email, and WhatsApp number if you give one. Artists also store a photo, bio, city, and track files. Enquiry forms store the WhatsApp number you leave so we can reply.",
      },
      {
        heading: "Who can see it",
        body: "Your public page shows your name, photo, bio, and music. Email and WhatsApp stay off the public page. Desk staff can see them so they can review uploads and answer bookings.",
      },
      {
        heading: "Your music",
        body: "You keep the copyright. Uploading a track does not hand ownership to Inner Soul Records or Dreamin' Indie. We only host the file and may play or promote it on this platform and at live venues. Delete a track any time from your page.",
      },
      {
        heading: "How long we keep it",
        body: "We keep your account while it is open. If you want the account removed, write to Desk staff from the app or to Inner Soul Records and we will delete the profile, songs, and contact details we hold.",
      },
    ],
  },
  zh: {
    kicker: "Dreamin' Indie",
    title: "私隱及條款",
    back: "返回平台",
    sections: [
      {
        heading: "我們是誰",
        body: "Dreamin' Indie 由香港 Inner Soul Records 營運。本頁說明你在此開立的帳戶，以及你上載的歌曲。",
      },
      {
        heading: "我們儲存什麼",
        body: "註冊或更新檔案時，我們會儲存你的名稱、用戶名稱、電郵，以及你提供的 WhatsApp 號碼。音樂人還會儲存頭像、簡介、地區及歌曲檔案。查詢表會儲存你留下的 WhatsApp，以便回覆。",
      },
      {
        heading: "誰可以看見",
        body: "公開專頁顯示名稱、頭像、簡介及音樂。電郵及 WhatsApp 不會出現在公開專頁。後台職員可見這些資料，以便審批上載及回覆預訂。",
      },
      {
        heading: "你的音樂",
        body: "你保留版權。上載歌曲並不代表把擁有權交給 Inner Soul Records 或 Dreamin' Indie。我們只存放檔案，並可於本平台及現場場地播放或推廣。你可以隨時在專頁刪除歌曲。",
      },
      {
        heading: "保存多久",
        body: "帳戶存在期間我們會保存資料。若要刪除帳戶，可透過應用程式聯絡後台或 Inner Soul Records，我們會刪除所持有的檔案、歌曲及聯絡資料。",
      },
    ],
  },
} as const;

export function legalCopy(locale: Locale) {
  return LEGAL_PAGE[locale === "zh" ? "zh" : "en"];
}

export function uploadTermsCopy(locale: Locale) {
  return UPLOAD_TERMS[locale === "zh" ? "zh" : "en"];
}
