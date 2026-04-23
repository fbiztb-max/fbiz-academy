import { Link } from "react-router-dom";
import Brand from "@/components/Brand";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background py-10 px-4" dir="rtl">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <Brand size="md" />
          <Link to="/" className="text-sm font-bold text-primary hover:underline">العودة للرئيسية</Link>
        </div>
        <div className="surface-card p-8 prose prose-invert max-w-none">
          <h1 className="text-3xl font-black mb-2">الشروط والأحكام</h1>
          <p className="text-muted-foreground mb-6">آخر تحديث: 2026/04/23</p>

          <h2 className="text-xl font-black mt-6 mb-2">1. القبول بالشروط</h2>
          <p>باستخدامك أكاديمية FBiz التابعة لقناة "فراس بزنس"، فإنك توافق على الالتزام بهذه الشروط وجميع الأنظمة والقوانين السارية في بلدك من الدول العربية، بما فيها أنظمة المعاملات الإلكترونية، حماية البيانات الشخصية، ومكافحة الجرائم المعلوماتية.</p>

          <h2 className="text-xl font-black mt-6 mb-2">2. الأهلية</h2>
          <p>يجب أن لا يقل عمر المستخدم عن 18 عاماً، أو أن يكون لديه إذن من ولي أمره. يلتزم المستخدم بتقديم بيانات صحيحة وحديثة عند التسجيل.</p>

          <h2 className="text-xl font-black mt-6 mb-2">3. الملكية الفكرية</h2>
          <p>جميع المحتويات (الفيديوهات، النصوص، الشعارات، التصاميم) ملك حصري لأكاديمية FBiz وقناة فراس بزنس، ومحمية بقوانين الملكية الفكرية في الدول العربية والاتفاقيات الدولية. يُمنع نسخ أو إعادة نشر أو بيع المحتوى بأي شكل دون إذن خطي مسبق.</p>

          <h2 className="text-xl font-black mt-6 mb-2">4. استخدام المنصة</h2>
          <ul className="list-disc pr-6 space-y-1">
            <li>يُمنع نشر أي محتوى مخالف للآداب العامة أو الشريعة الإسلامية أو الأنظمة المعمول بها.</li>
            <li>يُمنع التحرش أو الإساءة لأي مستخدم أو مدرّب.</li>
            <li>يُمنع محاولة اختراق المنصة أو الإخلال بأمنها.</li>
            <li>يحق للإدارة تعليق أو حذف أي حساب يخالف هذه الشروط دون إشعار مسبق.</li>
          </ul>

          <h2 className="text-xl font-black mt-6 mb-2">5. المدفوعات والاسترجاع</h2>
          <p>أي اشتراكات أو رسوم مدفوعة تخضع لسياسة الاسترجاع المعلنة وفقاً لأنظمة حماية المستهلك في بلد المستخدم.</p>

          <h2 className="text-xl font-black mt-6 mb-2">6. حدود المسؤولية</h2>
          <p>تُقدَّم خدمات الأكاديمية "كما هي" دون ضمانات لتحقيق نتائج مالية محددة. لا تتحمل الأكاديمية مسؤولية أي قرارات تجارية يتخذها المستخدم بناءً على المحتوى التدريبي.</p>

          <h2 className="text-xl font-black mt-6 mb-2">7. تعديل الشروط</h2>
          <p>يحق للأكاديمية تعديل هذه الشروط في أي وقت، ويُعتبر استمرار استخدامك للمنصة موافقةً على التعديلات.</p>

          <h2 className="text-xl font-black mt-6 mb-2">8. القانون الحاكم</h2>
          <p>تخضع هذه الشروط لأنظمة الدولة التي يقيم فيها المستخدم، مع الإشارة إلى أنظمة المملكة العربية السعودية كمرجع رئيسي عند الحاجة.</p>

          <h2 className="text-xl font-black mt-6 mb-2">9. التواصل</h2>
          <p>لأي استفسار قانوني، يمكنك التواصل عبر صفحة الإعدادات داخل المنصة.</p>
        </div>
      </div>
    </div>
  );
}
