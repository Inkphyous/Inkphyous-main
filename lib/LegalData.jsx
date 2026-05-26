import React from 'react';

export const getLegalContent = (language, t) => {
  const isArabic = language === 'ar';

  const shippingContent = {
    sections: isArabic ? [
      {
        title: "معالجة الطلب",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide text-right" dir="rtl">
            <p>يرجى السماح بما يصل إلى <strong>24 ساعة</strong> لمعالجة الطلب، وهذا يتوقف على توفر المنتج والتحقق من الدفع.</p>
            <p>بمجرد تأكيد الطلب، <strong>لا يمكن تعديله أو إلغاؤه</strong>.</p>
            <p>يتم معالجة الطلبات وشحنها من <strong>ماهاراشترا، الهند</strong>، باستثناء عطلات نهاية الأسبوع والعطلات الرسمية.</p>
            <p>سيتلقى العملاء <strong>بريدًا إلكترونيًا لتأكيد الطلب</strong> عند الدفع الناجح و<strong>تأكيد الشحن</strong> مع تفاصيل التتبع بمجرد إرسال الطلب.</p>
            <p>تحتفظ <strong>Inkphyous</strong> بالحق في إلغاء أي طلب وفقًا لتقديرها لأسباب أمنية أو للتحقق.</p>
          </div>
        )
      },
      {
        title: "الطلبات المسبقة",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide text-right" dir="rtl">
            <p>سيتم شحن عناصر الطلب المسبق عند وصولها إلى منشأتنا.</p>
            <p>يتم احتساب تكلفة جميع الطلبات المسبقة عند الدفع وهي <strong>غير قابلة للإلغاء وغير قابلة للاسترداد</strong>.</p>
            <p>للمساعدة، اتصل بـ <strong>info@inkphyous.com</strong>.</p>
          </div>
        )
      },
      {
        title: "الشحن",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide text-right" dir="rtl">
            <p><strong>الطلبات المحلية:</strong> توصيل قياسي مجاني في غضون <strong>3-5 أيام عمل</strong> بعد الإرسال.</p>
            <p><strong>الطلبات الدولية:</strong> يتم شحنها عبر <strong>DHL/UPS أو ما يعادلها</strong>. الرسوم والضرائب والمصاريف تقع على عاتق العميل.</p>
            <p>أوقات التسليم هي تقديرات وتستثني فترات المعالجة. <strong>Inkphyous</strong> ليست مسؤولة عن التأخير بسبب الجمارك أو مشاكل البريد السريع.</p>
          </div>
        )
      },
      {
        title: "الشحنات المفقودة أو التالفة",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide text-right" dir="rtl">
            <p>بمجرد وضع علامة على الطلب على أنه تم تسليمه من قبل شركة الشحن، لا تتحمل <strong>Inkphyous</strong> أي مسؤولية عن الفقد أو السرقة أو التلف. تقع جميع مخاطر النقل على عاتق شريك البريد السريع.</p>
          </div>
        )
      },
      {
        title: "البيع النهائي",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide text-right" dir="rtl">
            <p>العناصر التي تم شراؤها أثناء <strong>المبيعات أو العروض الترويجية</strong> هي <strong>بيع نهائي</strong> وليست مؤهلة للإرجاع أو الاستبدال أو الاسترداد.</p>
            <p>يجوز لـ <strong>Inkphyous</strong> تعديل أو سحب شروط البيع في أي وقت دون إشعار. لن يتم إجراء أي تعديلات في الأسعار للمشتريات السابقة.</p>
          </div>
        )
      },
      {
        title: "دعم العملاء",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide text-right" dir="rtl">
            <p>لأي استفسارات بخصوص الطلبات أو الشحن أو التسليم، يرجى الاتصال بنا على <a href="mailto:info@inkphyous.com" className="text-rose-600 hover:underline">info@inkphyous.com</a> أو <strong>ملء النموذج في صفحة الاتصال الخاصة بنا</strong>.</p>
          </div>
        )
      }
    ] : [
      {
        title: "Order Processing",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide">
            <p>Please allow up to <strong>24 hours</strong> for order processing, subject to product availability and payment verification.</p>
            <p>Once an order has been confirmed, it <strong>cannot be modified or cancelled</strong>.</p>
            <p>Orders are processed and shipped from <strong>Maharashtra, India</strong>, excluding weekends and public holidays.</p>
            <p>Customers will receive an <strong>order confirmation email</strong> upon successful checkout and a <strong>shipping confirmation</strong> with tracking details once the order is dispatched.</p>
            <p><strong>Inkphyous</strong> reserves the right to cancel any order at its discretion for security or verification reasons.</p>
          </div>
        )
      },
      {
        title: "Pre-Orders",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide">
            <p>Pre-order items will be shipped upon arrival at our facility.</p>
            <p>All pre-orders are charged at checkout and are <strong>non-cancellable and non-refundable</strong>.</p>
            <p>For assistance, contact <strong>info@inkphyous.com</strong>.</p>
          </div>
        )
      },
      {
        title: "Shipping",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide">
            <p><strong>Domestic Orders:</strong> Complimentary standard delivery within <strong>3–5 business days</strong> after dispatch.</p>
            <p><strong>International Orders:</strong> Shipped via <strong>DHL/UPS or equivalent</strong>. Duties, taxes, and fees are the customer's responsibility.</p>
            <p>Delivery times are estimates and exclude processing periods. <strong>Inkphyous</strong> is not liable for delays due to customs or courier issues.</p>
          </div>
        )
      },
      {
        title: "Lost or Damaged Shipments",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide">
            <p>Once an order is marked as delivered by the courier, <strong>Inkphyous</strong> assumes no liability for loss, theft, or damage. All transit risks rest with the courier partner.</p>
          </div>
        )
      },
      {
        title: "Final Sale",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide">
            <p>Items purchased during <strong>sales or promotions</strong> are <strong>final sale</strong> and not eligible for return, exchange, or refund.</p>
            <p><strong>Inkphyous</strong> may modify or withdraw sale terms at any time without notice. No price adjustments will be made for prior purchases.</p>
          </div>
        )
      },
      {
        title: "Customer Support",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide">
            <p>For any queries regarding orders, shipping, or delivery, please contact us on <a href="mailto:info@inkphyous.com" className="text-rose-600 hover:underline">info@inkphyous.com</a> or <strong>fill out the form on our Contact Page</strong>.</p>
          </div>
        )
      }
    ]
  };

  const termsContent = {
    sections: isArabic ? [
      {
        title: "مقدمة",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide text-right" dir="rtl">
            <p>مرحباً بك في <strong>Inkphyous.com</strong>، وهو موقع إلكتروني مملوك ومدار من قبل <strong>Inkphyous, LLC</strong> ("Inkphyous" أو "نحن" أو "نا"). تطبق <strong>شروط الاستخدام</strong> هذه و<strong>سياسة الخصوصية</strong> الخاصة بنا على جميع الزوار والمستخدمين وغيرهم ممن يصلون إلى أو يستخدمون هذا الموقع ("المستخدمون" أو "أنت").</p>
            <p>من خلال الوصول إلى هذا الموقع أو استخدامه و/أو شراء المنتجات من خلاله، فإنك توافق على الامتثال والالتزام بشروط الاستخدام هذه وسياسة الخصوصية الخاصة بنا. إذا كنت لا توافق على شروط الاستخدام هذه أو سياسة الخصوصية، فيجب عليك عدم الوصول إلى هذا الموقع أو استخدامه.</p>
            <p>آخر تحديث في [أدخل التاريخ].</p>
          </div>
        )
      },
      {
        title: "أهلية الاستخدام",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide text-right" dir="rtl">
            <p>يجب أن يكون عمرك <strong>16 عامًا</strong> على الأقل لاستخدام هذا الموقع. باستخدام الموقع، فإنك تقر بأنك تفي بمتطلبات العمر هذه.</p>
            <p>نحتفظ بالحق في إنهاء الوصول إذا كان المستخدم قاصرًا أو غير مؤهل قانونيًا.</p>
          </div>
        )
      },
      {
        title: "الحساب والعضوية",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide text-right" dir="rtl">
            <p>بإمكانك تصفح موقعنا بحرية دون إنشاء حساب. ومع ذلك، لإجراء عملية شراء أو المتابعة للدفع، سيُطلب منك تسجيل الدخول أو إنشاء حساب باستخدام معلومات دقيقة وحديثة وكاملة.</p>
            <p>قد نقوم بإلغاء أو إنهاء تسجيلك في أي وقت، دون إشعار، وفقًا لتقديرنا.</p>
          </div>
        )
      },
      {
        title: "الاتصالات الإلكترونية",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide text-right" dir="rtl">
            <p>باستخدام الموقع أو التواصل معنا إلكترونيًا، فإنك توافق على تلقي الاتصالات منا إلكترونيًا.</p>
          </div>
        )
      },
      {
        title: "السلوك والتعليقات",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide text-right" dir="rtl">
            <p>أنت توافق على استخدام الموقع بشكل قانوني ومسؤول. لن تنشر أو ترسل محتوى غير قانوني أو مخالف أو مسيء أو تشهيري أو بذيء أو مهدد أو يحتوي على فيروسات أو رسائل عشوائية.</p>
            <p>تصبح جميع التعليقات والمراجعات والتعليقات أو المشاركات ("التعليقات") ملكية حصرية لنا. يجوز لنا استخدامها أو إعادة إنتاجها أو تعديلها أو نشرها أو توزيعها دون أي التزام تجاهك.</p>
            <p>نحتفظ بالحق (ولكننا لسنا ملزمين) بمراقبة أو تعديل أو إزالة أي تعليقات.</p>
          </div>
        )
      },
      {
        title: "الملكية الفكرية",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide text-right" dir="rtl">
            <p>جميع محتويات الموقع، بما في ذلك النصوص والرسومات والشعارات والصور والبرامج، هي ملك لـ <strong>Inkphyous</strong> ومحمية بموجب قوانين الملكية الفكرية.</p>
            <p>لا يجوز لك إعادة إنتاج أو توزيع أو إنشاء أعمال مشتقة من المحتوى دون إذن كتابي صريح.</p>
          </div>
        )
      },
      {
        title: "معلومات المنتج والدقة",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide text-right" dir="rtl">
            <p>نسعى جاهدين لعرض المنتجات بدقة، ولكن قد تختلف الألوان والأحجام والتفاصيل بسبب أجهزة العرض أو عوامل أخرى.</p>
            <p>أوصاف المنتج وأسعاره وتوافره عرضة للتغيير دون إشعار.</p>
            <p>نحتفظ بالحق في تحديد الكميات أو تعديل معلومات المنتج أو رفض/إلغاء الطلبات في حالات الخطأ، ما لم يكن المنتج قد تم إرساله بالفعل.</p>
          </div>
        )
      },
      {
        title: "الطلبات والمدفوعات",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide text-right" dir="rtl">
            <p>بتقديم طلب، فإنك توافق على تقديم معلومات شراء وحساب كاملة ودقيقة.</p>
            <p>يجب سداد المبلغ في وقت الشراء. جميع المدفوعات غير قابلة للاسترداد ما لم ينص على خلاف ذلك.</p>
            <p>نحتفظ بالحق في رفض أو إلغاء الطلبات، وإخطارك عبر البريد الإلكتروني المقدم.</p>
          </div>
        )
      },
      {
        title: "الشحن والتوصيل",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide text-right" dir="rtl">
            <p>تختلف تكاليف الشحن وأوقات التسليم بناءً على موقعك وطريقة الشحن المختارة.</p>
            <p>نحن لسنا مسؤولين عن التأخير أو الفقد أو التلف الذي يحدث أثناء الشحن.</p>
            <p>تنتقل الملكية والمخاطر إليك بمجرد شحن المنتج إلى شركة النقل.</p>
          </div>
        )
      },
      {
        title: "الإرجاع والاسترداد",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide text-right" dir="rtl">
            <p>يرجى الرجوع إلى <strong>سياسة الإرجاع</strong> الخاصة بنا للحصول على التفاصيل. جميع المبيعات نهائية ما لم ينص على خلاف ذلك في سياسة الإرجاع الخاصة بنا.</p>
          </div>
        )
      },
      {
        title: "حدود المسؤولية",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide text-right" dir="rtl">
            <p>Inkphyous ليست مسؤولة عن أي أضرار مباشرة أو غير مباشرة تنشأ عن استخدامك للموقع أو المنتجات المشتراة من خلاله.</p>
            <p>لا تتجاوز مسؤوليتنا في أي حال من الأحوال المبلغ المدفوع للمنتج.</p>
          </div>
        )
      },
      {
        title: "التسعير",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide text-right" dir="rtl">
            <p>يتم عرض الأسعار افتراضيًا بـ <strong>الدرهم الإماراتي (AED)</strong> للعملاء في دبي وبـ <strong>الروبية الهندية (INR)</strong> للعملاء في الهند.</p>
            <p>تشمل جميع الأسعار الضرائب السارية ولكنها لا تشمل تكاليف الشحن. يمكنك تغيير العملة المعروضة في أي وقت باستخدام خيار اختيار العملة المتاح أسفل الموقع.</p>
            <p>قد تتغير الأسعار وفقًا لتقديرنا دون إشعار مسبق.</p>
          </div>
        )
      },
      {
        title: "طرق الدفع والأمان",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide text-right" dir="rtl">
            <p>طرق الدفع المقبولة تشمل:</p>
            <ul className="list-disc mr-4 sm:mr-6 space-y-1">
              <li><strong>الدفع عند الاستلام (COD)</strong> - قد يتم تطبيق رسوم إضافية</li>
              <li><strong>بطاقات الائتمان/الخصم</strong> - Visa و MasterCard و AMEX و Rupay و Maestro</li>
              <li><strong>مدفوعات UPI</strong> - Google Pay و PhonePe و BHIM، إلخ.</li>
              <li><strong>المحافظ</strong> - Paytm و Razorpay، إلخ.</li>
            </ul>
            <p>تتم معالجة المدفوعات بشكل آمن باستخدام <strong>تشفير SSL</strong>. لا نطلب أبدًا تفاصيل الحساب أو الدفع عبر البريد الإلكتروني.</p>
          </div>
        )
      },
      {
        title: "الإنهاء",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide text-right" dir="rtl">
            <p>قد نقوم بتعليق أو إنهاء وصولك إذا انتهكت هذه الشروط. لا يؤثر الإنهاء على الحقوق أو الالتزامات المستحقة.</p>
            <p>قد يتم حذف المحتوى ومعلومات الحساب دون أي مسؤولية.</p>
          </div>
        )
      },
      {
        title: "القانون الحاكم",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide text-right" dir="rtl">
            <p>تخضع هذه الشروط وأي اتفاقيات بينك وبين Inkphyous لـ <strong>قوانين الهند</strong>.</p>
          </div>
        )
      },
      {
        title: "التغييرات في الشروط",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide text-right" dir="rtl">
            <p>قد نقوم بتحديث أو تعديل هذه الشروط في أي وقت دون إشعار.</p>
            <p>استخدام الموقع المستمر بعد التغييرات يشكل قبولاً للشروط المحدثة.</p>
          </div>
        )
      },
      {
        title: "معلومات الاتصال",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide text-right" dir="rtl">
            <p>للأسئلة أو المخاوف المتعلقة بهذه الشروط، يرجى الاتصال بنا على: <a href="mailto:info@inkphyous.com" className="text-rose-600 hover:underline">info@inkphyous.com</a>.</p>
          </div>
        )
      }
    ] : [
      {
        title: "Introduction",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide">
            <p>Welcome to <strong>Inkphyous.com</strong> , a website owned and operated by <strong>Inkphyous, LLC</strong> ("Inkphyous," "we," or "us"). These <strong>Terms of Use</strong> and our <strong>Privacy Policy</strong> apply to all visitors, users, and others who access or use this Website ("Users" or "you").</p>
            <p>By accessing or using this Website and/or purchasing products through it, you agree to comply with and be bound by these Terms of Use and our Privacy Policy. If you do not agree to these Terms of Use or the Privacy Policy, you must not access or use this Website.</p>
            <p>Last updated on [Insert Date].</p>
          </div>
        )
      },
      {
        title: "Eligibility to Use",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide">
            <p>You must be at least <strong>16 years old</strong> to use this Website. By using the Website, you represent that you meet this age requirement.</p>
            <p>We reserve the right to terminate access if a user is underage or otherwise legally incapacitated.</p>
          </div>
        )
      },
      {
        title: "Account and Membership",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide">
            <p>You may freely browse our website without creating an account. However, to make a purchase or proceed to checkout, you will be required to log in or create an account using accurate, current, and complete information.</p>
            <p>We may revoke or terminate your registration at any time, without notice, at our discretion.</p>
          </div>
        )
      },
      {
        title: "Electronic Communications",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide">
            <p>By using the Website or communicating with us electronically, you consent to receive communications electronically from us.</p>
          </div>
        )
      },
      {
        title: "Conduct and Comments",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide">
            <p>You agree to use the Website lawfully and responsibly. You will not post or submit content that is unlawful, infringing, abusive, defamatory, obscene, threatening, or contains viruses or spam.</p>
            <p>All comments, reviews, feedback, or submissions ("Comments") become our exclusive property. We may use, reproduce, modify, publish, or distribute them without obligation to you.</p>
            <p>We reserve the right (but are not obligated) to monitor, edit, or remove any Comments.</p>
          </div>
        )
      },
      {
        title: "Intellectual Property",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide">
            <p>All content on the Website, including text, graphics, logos, images, and software, is the property of <strong>Inkphyous</strong> and is protected under intellectual property laws.</p>
            <p>You may not reproduce, distribute, or create derivative works from content without express written permission.</p>
          </div>
        )
      },
      {
        title: "Product Information and Accuracy",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide">
            <p>We strive to display products accurately, but colors, sizes, and details may vary due to display devices or other factors.</p>
            <p>Product descriptions, pricing, and availability are subject to change without notice.</p>
            <p>We reserve the right to limit quantities, modify product information, or refuse/cancel orders in cases of error, unless the product has already been dispatched.</p>
          </div>
        )
      },
      {
        title: "Orders and Payments",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide">
            <p>By placing an order, you agree to provide complete and accurate purchase and account information.</p>
            <p>Payment must be made at the time of purchase. All payments are non-refundable unless otherwise stated.</p>
            <p>We reserve the right to refuse or cancel orders, notifying you via the email provided.</p>
          </div>
        )
      },
      {
        title: "Shipping and Delivery",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide">
            <p>Shipping costs and delivery times vary based on your location and selected shipping method.</p>
            <p>We are not responsible for delays, loss, or damages occurring during shipping.</p>
            <p>Title and risk pass to you once the product is shipped to the carrier.</p>
          </div>
        )
      },
      {
        title: "Returns and Refunds",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide">
            <p>Please refer to our <strong>Return Policy</strong> for details. All sales are final unless otherwise stated in our Return Policy.</p>
          </div>
        )
      },
      {
        title: "Limitation of Liability",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide">
            <p>Inkphyous is not liable for any direct or indirect damages arising from your use of the Website or products purchased through it.</p>
            <p>In no event shall our liability exceed the amount paid for the product.</p>
          </div>
        )
      },
      {
        title: "Pricing",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide">
            <p>Prices are displayed by default in <strong>United Arab Emirates Dirhams (AED)</strong> for customers in Dubai and in <strong>Indian Rupees (INR)</strong> for customers in India.</p>
            <p>All prices include applicable taxes but exclude shipping costs. You may change the displayed currency at any time using the currency selection option available at the bottom of the website.</p>
            <p>Prices may change at our discretion without prior notice.</p>
          </div>
        )
      },
      {
        title: "Payment Methods & Security",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide">
            <p>Accepted payment methods include:</p>
            <ul className="list-disc ml-4 sm:ml-6 space-y-1">
              <li><strong>Cash on Delivery (COD)</strong> – additional charges may apply</li>
              <li><strong>Credit/Debit Cards</strong> – Visa, MasterCard, AMEX, Rupay, Maestro</li>
              <li><strong>UPI Payments</strong> – Google Pay, PhonePe, BHIM, etc.</li>
              <li><strong>Wallets</strong> – Paytm, Razorpay, etc.</li>
            </ul>
            <p>Payments are securely processed using <strong>SSL encryption</strong>. We never request account or payment details via email.</p>
          </div>
        )
      },
      {
        title: "Termination",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide">
            <p>We may suspend or terminate your access if you breach these Terms. Termination does not affect accrued rights or obligations.</p>
            <p>Content and account information may be deleted without liability.</p>
          </div>
        )
      },
      {
        title: "Governing Law",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide">
            <p>These Terms and any agreements between you and Inkphyous are governed by the <strong>laws of India</strong>.</p>
          </div>
        )
      },
      {
        title: "Changes to Terms",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide">
            <p>We may update or modify these Terms at any time without notice.</p>
            <p>Continued use of the Website after changes constitutes acceptance of the updated Terms.</p>
          </div>
        )
      },
      {
        title: "Contact Information",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide">
            <p>For questions or concerns regarding these Terms, please contact us at: <a href="mailto:info@inkphyous.com" className="text-rose-600 hover:underline">info@inkphyous.com</a>.</p>
          </div>
        )
      }
    ]
  };

  const returnsContent = {
    sections: isArabic ? [
      {
        title: "شروط عامة",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide text-right" dir="rtl">
            <p>تخضع سياسة الإرجاع والاستبدال هذه ("السياسة") لجميع المشتريات التي تتم من خلال <strong>Inkphyous.com</strong> ("الموقع") وبوابة الإرجاع والاستبدال <strong>Inkphyous</strong>.</p>
            <p>من خلال تقديم طلب أو بدء طلب إرجاع أو استبدال، فإنك تقر وتوافق على شروط هذه السياسة.</p>
            <p>الإصدار المطبق على طلبك سيكون هو المعمول به في وقت الشراء.</p>
          </div>
        )
      },
      {
        title: "الإرجاع والاستبدال",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide text-right" dir="rtl">
            <p>نقبل طلبات الإرجاع والاستبدال في غضون <strong>خمسة (5) أيام</strong> من تاريخ التسليم.</p>
            <p>بمجرد مراجعة طلبك والموافقة عليه، سيحدد شريكنا اللوجستي موعدًا للاستلام في غضون <strong>24-48 ساعة</strong>، رهنًا بتوفر الخدمة في منطقتك. سيتم محاولة الاستلام حتى <strong>مرتين</strong>.</p>
            <p>إذا كان شريك البريد السريع لدينا غير قادر على إكمال الاستلام، فقد يُطلب منك <strong>إعادة الشحنة مباشرة</strong> إلى مستودعنا. تخضع خدمة الاستلام العكسي للتوافر بناءً على تغطية الرمز البريدي لمنطقتك.</p>
            <p>تخضع المنتجات المعادة لـ <strong>فحص الجودة (QC)</strong> الإلزامي عند استلامها. يجب إعادة المنتجات في حالة <strong>غير مستخدمة وغير مغسولة وغير تالفة</strong>، مع التعبئة والتغليف الأصلية وعلامات العلامة التجارية وجميع الملحقات المصاحبة.</p>
            <p>إذا كان الحجم أو العنصر المطلوب غير متوفر، فسيتم إصدار <strong>بطاقة هدايا</strong> بقيمة معادلة، قابلة للاسترداد للمشتريات المستقبلية عبر الإنترنت.</p>
          </div>
        )
      },
      {
        title: "الإلغاء والاسترداد",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide text-right" dir="rtl">
            <p><strong>طلبات الدفع عند الاستلام (COD):</strong> يمكن إلغاؤها فقط <strong>قبل الإرسال</strong> من مستودعنا.</p>
            <p><strong>الطلبات المدفوعة مسبقًا:</strong> هي <strong>نهائية وغير قابلة للاسترداد</strong> بمجرد تأكيدها.</p>
            <p>سيتم إصدار المبالغ المستردة، عند الاقتضاء، كـ <strong>بطاقات هدايا</strong> صالحة لمدة <strong>ستة (6) أشهر</strong> من تاريخ الإصدار. رسوم الشحن والمناولة غير قابلة للاسترداد.</p>
          </div>
        )
      },
      {
        title: "مخاوف جودة المنتج",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide text-right" dir="rtl">
            <p>تقدم <strong>Inkphyous</strong> <strong>فترة مراجعة لمدة 15 يومًا</strong> لقضايا المنتج الحقيقية مثل تلاشي اللون أو تشقق الطباعة أو عيوب التصنيع.</p>
            <p>إذا تم الإبلاغ في غضون هذه الفترة، فسنقوم بترتيب استلام وتوفير حل مناسب في شكل استبدال أو ائتمان متجر. لن تكون الطلبات المقدمة بعد فترة الـ 15 يومًا مؤهلة للإرجاع أو التعويض.</p>
          </div>
        )
      },
      {
        title: "شروط القبول",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide text-right" dir="rtl">
            <p>لن يتم قبول طلبات الإرجاع أو الاستبدال إلا إذا تم استيفاء المعايير التالية:</p>
            <ul className="list-disc mr-4 sm:mr-6 space-y-1">
              <li>العنصر في حالته الأصلية، دون أي علامات على الاستخدام أو الرائحة أو الضرر.</li>
              <li>جميع علامات العلامة التجارية والتعبئة والتغليف والملحقات سليمة.</li>
              <li>يتم إرجاع المنتجات المشتراة كمجموعات بالكامل.</li>
              <li>يتم بدء الإرجاع مقابل نفس الطلب ويتم التحقق منه بواسطة سجلات <strong>Inkphyous</strong>.</li>
            </ul>
            <p>تحتفظ <strong>Inkphyous</strong> بالحق في <strong>رفض أي طلب</strong> يفشل في تلبية المتطلبات المذكورة أعلاه.</p>
          </div>
        )
      },
      {
        title: "دعم العملاء",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide text-right" dir="rtl">
            <p>لأي مساعدة أو توضيح بخصوص الإرجاع أو الاستبدال أو الإلغاء، يرجى الاتصال بنا على <a href="mailto:info@inkphyous.com" className="text-rose-600 hover:underline">info@inkphyous.com</a> أو <strong>ملء النموذج في صفحة الاتصال الخاصة بنا</strong>.</p>
            <p>يسعى فريقنا للرد على جميع الاستفسارات في غضون <strong>24-48 ساعة عمل</strong>.</p>
          </div>
        )
      }
    ] : [
      {
        title: "General Terms",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide">
            <p>This Return & Exchange Policy ("Policy") governs all purchases made through <strong>Inkphyous.com</strong> ("Website") and the <strong>Inkphyous Return & Exchange Portal</strong>.</p>
            <p>By placing an order or initiating a return or exchange request, you acknowledge and agree to the terms of this Policy.</p>
            <p>The version applicable to your order will be the one in effect at the time of purchase.</p>
          </div>
        )
      },
      {
        title: "Returns and Exchanges",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide">
            <p>We accept return and exchange requests within <strong>Five (5) days</strong> from the date of delivery.</p>
            <p>Once your request has been reviewed and approved, our logistics partner will schedule a collection within <strong>24–48 hours</strong>, subject to service availability in your area. Pickups will be attempted up to <strong>two times</strong>.</p>
            <p>If our courier partner is unable to complete the collection, you may be required to <strong>return the shipment directly</strong> to our warehouse. Reverse pickup service is subject to availability based on your area's pincode coverage.</p>
            <p>Returned products undergo a mandatory <strong>Quality Check (QC)</strong> upon receipt. Products must be returned in <strong>unused, unwashed, and undamaged</strong> condition, with original packaging, brand tags, and all accompanying accessories intact.</p>
            <p>If the requested size or item is unavailable, a <strong>gift card</strong> of equivalent value will be issued, redeemable for future online purchases.</p>
          </div>
        )
      },
      {
        title: "Cancellations and Refunds",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide">
            <p><strong>Cash on Delivery (COD) Orders:</strong> May be cancelled only <strong>prior to dispatch</strong> from our warehouse.</p>
            <p><strong>Prepaid Orders:</strong> Are <strong>final and non-refundable</strong> once confirmed.</p>
            <p>Refunds, where applicable, will be issued as <strong>gift cards</strong> valid for <strong>six (6) months</strong> from the date of issue. Shipping and handling charges are non-refundable.</p>
          </div>
        )
      },
      {
        title: "Product Quality Concerns",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide">
            <p><strong>Inkphyous</strong> offers a <strong>15-day review period</strong> for genuine product issues such as color fading, print cracking, or manufacturing defects.</p>
            <p>If reported within this period, we will arrange a pickup and provide an appropriate resolution in the form of replacement or store credit. Requests submitted after the 15-day period will not be eligible for return or compensation.</p>
          </div>
        )
      },
      {
        title: "Conditions for Acceptance",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide">
            <p>Return or exchange requests will only be accepted if the following criteria are met:</p>
            <ul className="list-disc ml-4 sm:ml-6 space-y-1">
              <li>The item is in its original condition, with no signs of use, odor, or damage.</li>
              <li>All brand labels, packaging, and accessories are intact.</li>
              <li>Products purchased as sets are returned in full.</li>
              <li>The return is initiated against the same order and verified by <strong>Inkphyous</strong> records.</li>
            </ul>
            <p><strong>Inkphyous</strong> reserves the right to <strong>decline any request</strong> that fails to meet the above requirements.</p>
          </div>
        )
      },
      {
        title: "Customer Support",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide">
            <p>For any assistance or clarification regarding returns, exchanges, or cancellations, please contact us on <a href="mailto:info@inkphyous.com" className="text-rose-600 hover:underline">info@inkphyous.com</a> or <strong>fill out the form on our Contact Page</strong>.</p>
            <p>Our team strives to respond to all queries within <strong>24-48 business hours</strong>.</p>
          </div>
        )
      }
    ]
  };

  const privacyContent = {
    sections: isArabic ? [
      {
        title: "مقدمة",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide text-right" dir="rtl">
            <div className="text-sm text-gray-500 mb-4">
              <div className="flex flex-col sm:flex-row justify-between w-full gap-4 sm:gap-0">
                <div className="space-y-2 text-right">
                  <p className="font-semibold">تاريخ السريان</p>
                  <p className="font-semibold">آخر تحديث</p>
                </div>
                <div className="text-right space-y-2 text-gray-600">
                  <p>[أدخل التاريخ]</p>
                  <p>[أدخل التاريخ]</p>
                </div>
              </div>
            </div>
            <p>تقدر Inkphyous ("نحن"، "نا"، "لنا") خصوصيتك وتلتزم بحماية معلوماتك الشخصية. تشرح سياسة الخصوصية هذه كيف نجمع ونستخدم ونكشف ونحمي معلوماتك عند زيارة موقعنا الإلكتروني، <a href="https://www.inkphyous.com" className="text-rose-600 hover:underline">www.inkphyous.com</a> ("الموقع").</p>
            <p>من خلال الوصول إلى موقعنا الإلكتروني أو استخدامه، فإنك تقر بأنك قرأت وفهمت ووافقت على الالتزام بسياسة الخصوصية هذه.</p>
          </div>
        )
      },
      {
        title: "المعلومات التي نجمعها",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide text-right" dir="rtl">
            <p>قد نجمع الأنواع التالية من المعلومات لتزويدك بتجربة تسوق سلسة وآمنة:</p>
            <div className="space-y-4">
              <div>
                <p className="font-semibold label text-bold text-black text-xl sm:text-2xl">
                  أ. المعلومات الشخصية</p>
                <p>عند إجراء عملية شراء أو التفاعل مع موقعنا، قد نجمع تفاصيل مثل:</p>
                <ul className="list-disc mr-4 sm:mr-6 space-y-1">
                  <li>الاسم</li>
                  <li>عنوان البريد الإلكتروني</li>
                  <li>عنوان الشحن والفواتير</li>
                  <li>معلومات الدفع</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold label text-bold text-black text-xl sm:text-2xl">
                  ب. المعلومات غير الشخصية</p>
                <p>قد نجمع معلومات غير محددة الهوية تلقائيًا من خلال ملفات تعريف الارتباط أو أدوات التحليلات، بما في ذلك:</p>
                <ul className="list-disc mr-4 sm:mr-6 space-y-1">
                  <li>نوع المتصفح والإصدار</li>
                  <li>عنوان IP</li>
                  <li>معلومات الجهاز</li>
                  <li>الصفحات التي تمت زيارتها ومدة الزيارة</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold label text-bold text-black text-xl sm:text-2xl">
                  ج. معلومات المعاملات</p>
                <p>نجمع التفاصيل المتعلقة بالشراء، بما في ذلك سجل طلباتك، والمرتجعات، وتفضيلات المنتج، لتحسين تجربة التسوق الخاصة بك.</p>
              </div>
            </div>
          </div>
        )
      },
      {
        title: "كيف نستخدم معلوماتك",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide text-right" dir="rtl">
            <p>نستخدم معلوماتك فقط للأغراض التجارية المشروعة، بما في ذلك:</p>
            <ul className="list-disc mr-4 sm:mr-6 space-y-2">
              <li><strong>معالجة وتنفيذ الطلبات:</strong> لتأكيد مشترياتك، ومعالجة الدفعات، وترتيب الشحن، وإدارة المرتجعات، وتوفير تحديثات الطلب.</li>
              <li><strong>تحسين تجربة المستخدم:</strong> لتحليل أنماط التصفح، وتحسين أداء الموقع، وتحسين خدماتنا.</li>
              <li><strong>التسويق والاتصالات:</strong> بموافقتك، لإرسال عروض ترويجية، وتحديثات المنتج، أو النشرات الإخبارية.</li>
              <li><strong>الامتثال والحماية:</strong> للامتثال للالتزامات القانونية، ومنع الاحتيال، وإنفاذ سياساتنا، والرد على الطلبات القانونية من السلطات العامة.</li>
            </ul>
          </div>
        )
      },
      {
        title: "مشاركة معلوماتك",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide text-right" dir="rtl">
            <p>نحترم خصوصيتك ونشارك بياناتك الشخصية فقط عند الضرورة للأغراض التجارية والقانونية.</p>
            <ul className="list-disc mr-4 sm:mr-6 space-y-2">
              <li><strong>مقدمو الخدمات:</strong> قد نشارك المعلومات مع بائعين موثوقين من جهات خارجية يساعدوننا في تشغيل موقعنا، أو معالجة المدفوعات، أو توصيل المنتجات، أو تقديم خدمات أخرى. هؤلاء مقدمو الخدمات ملزمون تعاقديًا بحماية بياناتك واستخدامها فقط للأغراض المحددة من قبلنا.</li>
              <li><strong>تنفيذ الطلب:</strong> قد نشارك التفاصيل ذات الصلة (مثل الاسم، عنوان الشحن، تفاصيل الدفع) مع شركات النقل أو معالجي الدفع لإكمال عملية الشراء.</li>
              <li><strong>المتطلبات القانونية:</strong> قد نكشف عن معلوماتك عندما يقتضي القانون ذلك أو استجابةً لطلبات قانونية صالحة، بما في ذلك تلك المتعلقة بالأمن القومي أو إنفاذ القانون.</li>
              <li><strong>عدم بيع البيانات:</strong> نحن لا نبيع أو نؤجر أو نتاجر بمعلوماتك الشخصية مع أطراف ثالثة.</li>
            </ul>
          </div>
        )
      },
      {
        title: "أمن البيانات",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide text-right" dir="rtl">
            <p>ننفذ تدابير فنية وتنظيمية مناسبة لحماية بياناتك الشخصية من الوصول غير المصرح به أو التغيير أو الكشف أو التدمير. يشمل ذلك بوابات الدفع الآمنة، وتقنيات التشفير، وممارسات الأمان القياسية الأخرى في الصناعة.</p>
            <p>ومع ذلك، يرجى ملاحظة أنه لا توجد طريقة نقل عبر الإنترنت أو التخزين الإلكتروني آمنة تمامًا، ولا يمكننا ضمان الأمن المطلق.</p>
          </div>
        )
      },
      {
        title: "حقوقك",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide text-right" dir="rtl">
            <p>لديك الحق في:</p>
            <ul className="list-disc mr-4 sm:mr-6 space-y-1">
              <li>الوصول إلى البيانات الشخصية التي نحتفظ بها عنك ومراجعتها</li>
              <li>طلب تصحيحات أو تحديثات للمعلومات غير الدقيقة أو غير الكاملة</li>
              <li>طلب حذف بياناتك، وفقًا للالتزامات القانونية المعمول بها</li>
            </ul>
            <p className="mt-3">لممارسة هذه الحقوق، يرجى الاتصال بنا على <a href="mailto:info@inkphyous.com" className="text-rose-600 hover:underline">info@inkphyous.com</a>.</p>
          </div>
        )
      },
      {
        title: "ملفات تعريف الارتباط",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide text-right" dir="rtl">
            <p>يستخدم موقعنا ملفات تعريف الارتباط لتخصيص وتحسين تجربة التصفح الخاصة بك. ملفات تعريف الارتباط هي ملفات نصية صغيرة توضع على جهازك تساعدنا في التعرف على متصفحك، وتخزين التفضيلات، وتحليل أداء الموقع.</p>
            <p>يمكنك اختيار تعطيل ملفات تعريف الارتباط من خلال إعدادات المتصفح الخاص بك، ولكن قد يؤثر ذلك على ميزات أو وظائف معينة للموقع.</p>
          </div>
        )
      },
      {
        title: "التغييرات في سياسة الخصوصية هذه",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide text-right" dir="rtl">
            <p>قد نقوم بتحديث سياسة الخصوصية هذه من وقت لآخر لتعكس التغييرات في ممارساتنا أو تقنياتنا أو متطلباتنا القانونية. سيتم نشر أي مراجعات على هذه الصفحة مع تاريخ "آخر تحديث" محدث.</p>
            <p>نشجعك على مراجعة هذه السياسة بشكل دوري للبقاء على اطلاع حول كيفية حمايتنا لمعلوماتك.</p>
          </div>
        )
      },
      {
        title: "اتصل بنا",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide text-right" dir="rtl">
            <p>إذا كان لديك أي أسئلة أو مخاوف أو طلبات بخصوص سياسة الخصوصية هذه، يرجى الاتصال بنا على:</p>
            <p className="font-semibold">📧 البريد الإلكتروني: <a href="mailto:info@inkphyous.com" className="text-rose-600 hover:underline">info@inkphyous.com</a></p>
          </div>
        )
      }
    ] : [
      {
        title: "Introduction",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide">
            <div className="text-sm text-gray-500 mb-4 flex flex-col space-y-2">
              <div className="flex gap-4 sm:gap-8">
                <p className="font-semibold min-w-[120px]">Effective Date</p>
                <p className="text-gray-600">25/05/2026</p>
              </div>
              <div className="flex gap-4 sm:gap-8">
                <p className="font-semibold min-w-[120px]">Last Updated</p>
                <p className="text-gray-600">25/05/2026</p>
              </div>
            </div>
            <p>Inkphyous values your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website, <a href="https://www.inkphyous.com" className="text-rose-600 hover:underline">www.inkphyous.com</a> ("Website").</p>
            <p>By accessing or using our Website, you acknowledge that you have read, understood, and agree to be bound by this Privacy Policy.</p>
          </div>
        )
      },
      {
        title: "Information We Collect",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide">
            <p>We may collect the following types of information to provide you with a seamless and secure shopping experience:</p>
            <div className="space-y-4">
              <div>
                <p className="font-semibold label text-bold text-black text-xl sm:text-2xl">
                  a. Personal Information</p>
                <p>When you make a purchase or interact with our Website, we may collect details such as your:</p>
                <ul className="list-disc ml-4 sm:ml-6 space-y-1">
                  <li>Name</li>
                  <li>Email address</li>
                  <li>Shipping and billing address</li>
                  <li>Payment information</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold label text-bold text-black text-xl sm:text-2xl">
                  b. Non-Personal Information</p>
                <p>We may collect non-identifiable information automatically through cookies or analytics tools, including:</p>
                <ul className="list-disc ml-4 sm:ml-6 space-y-1">
                  <li>Browser type and version</li>
                  <li>IP address</li>
                  <li>Device information</li>
                  <li>Pages visited and duration of visit</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold label text-bold text-black text-xl sm:text-2xl">
                  c. Transactional Information</p>
                <p>We collect purchase-related details, including your order history, returns, and product preferences, to enhance your shopping experience.</p>
              </div>
            </div>
          </div>
        )
      },
      {
        title: "How We Use Your Information",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide">
            <p>We use your information only for legitimate business purposes, including to:</p>
            <ul className="list-disc ml-4 sm:ml-6 space-y-2">
              <li><strong>Process and Fulfill Orders:</strong> To confirm your purchases, process payments, arrange shipping, manage returns, and provide order updates.</li>
              <li><strong>Enhance User Experience:</strong> To analyze browsing patterns, improve website performance, and optimize our services.</li>
              <li><strong>Marketing and Communications:</strong> With your consent, to send you promotional offers, product updates, or newsletters.</li>
              <li><strong>Compliance and Protection:</strong> To comply with legal obligations, prevent fraud, enforce our policies, and respond to lawful requests by public authorities.</li>
            </ul>
          </div>
        )
      },
      {
        title: "Sharing Your Information",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide">
            <p>We respect your privacy and only share your personal data as necessary for business and legal purposes.</p>
            <ul className="list-disc ml-4 sm:ml-6 space-y-2">
              <li><strong>Service Providers:</strong> We may share information with trusted third-party vendors who assist us in operating our Website, processing payments, delivering products, or providing other services. These providers are contractually obligated to protect your data and use it solely for the purposes specified by us.</li>
              <li><strong>Order Fulfillment:</strong> We may share relevant details (e.g., name, shipping address, payment details) with carriers or payment processors to complete your purchase.</li>
              <li><strong>Legal Requirements:</strong> We may disclose your information when required by law or in response to valid legal requests, including those related to national security or law enforcement.</li>
              <li><strong>No Sale of Data:</strong> We do not sell, rent, or trade your personal information to third parties.</li>
            </ul>
          </div>
        )
      },
      {
        title: "Data Security",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide">
            <p>We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. This includes secure payment gateways, encryption technologies, and other industry-standard security practices.</p>
            <p>However, please note that no method of transmission over the internet or electronic storage is completely secure, and we cannot guarantee absolute security.</p>
          </div>
        )
      },
      {
        title: "Your Rights",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide">
            <p>You have the right to:</p>
            <ul className="list-disc ml-4 sm:ml-6 space-y-1">
              <li>Access and review the personal data we hold about you</li>
              <li>Request corrections or updates to inaccurate or incomplete information</li>
              <li>Request deletion of your data, subject to applicable legal obligations</li>
            </ul>
            <p className="mt-3">To exercise these rights, please contact us at <a href="mailto:info@inkphyous.com" className="text-rose-600 hover:underline">info@inkphyous.com</a>.</p>
          </div>
        )
      },
      {
        title: "Cookies",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide">
            <p>Our Website uses cookies to personalize and enhance your browsing experience. Cookies are small text files placed on your device that help us recognize your browser, store preferences, and analyze site performance.</p>
            <p>You may choose to disable cookies through your browser settings, but this may affect certain features or functionality of the Website.</p>
          </div>
        )
      },
      {
        title: "Changes to This Privacy Policy",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide">
            <p>We may update this Privacy Policy from time to time to reflect changes in our practices, technologies, or legal requirements. Any revisions will be posted on this page with an updated "Last Updated" date.</p>
            <p>We encourage you to review this policy periodically to stay informed about how we protect your information.</p>
          </div>
        )
      },
      {
        title: "Contact Us",
        content: (
          <div className="space-y-6 text-gray-700 leading-loose text-justify sm:text-left tracking-wide">
            <p>If you have any questions, concerns, or requests regarding this Privacy Policy, please contact us at:</p>
            <p className="font-semibold">📧 Email: <a href="mailto:info@inkphyous.com" className="text-rose-600 hover:underline">info@inkphyous.com</a></p>
          </div>
        )
      }
    ]
  };

  return { shippingContent, termsContent, returnsContent, privacyContent };
};
