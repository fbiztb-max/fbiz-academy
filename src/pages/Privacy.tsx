import { Link } from "react-router-dom";
import Brand from "@/components/Brand";
import FloatingContact from "@/components/FloatingContact";
import SiteFooter from "@/components/SiteFooter";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background py-10 px-4" dir="rtl">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <Brand size="md" />
          <Link to="/" className="text-sm font-bold text-primary hover:underline">العودة للرئيسية</Link>
        </div>
        <div className="surface-card p-8">
          <h1 className="text-3xl font-black mb-2">سياسة الخصوصية</h1>
          <p className="text-muted-foreground mb-6">آخر تحديث: 2026/04/23</p>

          <p>تلتزم أكاديمية FBiz بحماية خصوصية مستخدميها وفق نظام حماية البيانات الشخصية في المملكة العربية السعودية (PDPL)، ولوائح حماية البيانات في الإمارات والكويت وقطر والبحرين وعُمان ومصر والأردن وسائر الدول العربية، ومعايير اللائحة الأوروبية (GDPR) كحدّ أعلى.</p>

          <h2 className="text-xl font-black mt-6 mb-2">1. البيانات التي نجمعها</h2>
          <ul className="list-disc pr-6 space-y-1">
            <li>الاسم الكامل، البريد الإلكتروني، الصورة الشخصية.</li>
            <li>روابط حسابات التواصل الاجتماعي (اختياري).</li>
            <li>إجاباتك على المراحل التدريبية وملفاتك المرفوعة.</li>
            <li>بيانات الجلسة وعنوان IP لأغراض الأمان.</li>
          </ul>

          <h2 className="text-xl font-black mt-6 mb-2">2. استخدام البيانات</h2>
          <ul className="list-disc pr-6 space-y-1">
            <li>تشغيل المنصة وتقديم الخدمة التدريبية.</li>
            <li>تقييم تقدمك وتزويدك بملاحظات شخصية.</li>
            <li>التواصل معك بخصوص حسابك أو محتوى جديد.</li>
            <li>تحسين تجربة المستخدم وتطوير الخدمات.</li>
          </ul>

          <h2 className="text-xl font-black mt-6 mb-2">3. مشاركة البيانات</h2>
          <p>لا نبيع بياناتك ولا نشاركها مع أي طرف ثالث لأغراض تسويقية. قد نشارك بياناتك فقط في الحالات التالية:</p>
          <ul className="list-disc pr-6 space-y-1">
            <li>عند طلب رسمي من جهة قضائية مختصة.</li>
            <li>مع مزودي الخدمات التقنية (الاستضافة، التحليلات) ضمن اتفاقيات سرية.</li>
          </ul>

          <h2 className="text-xl font-black mt-6 mb-2">4. الكوكيز والتقنيات المماثلة</h2>
          <p>نستخدم ملفات تعريف ارتباط ضرورية لتشغيل الجلسة وتذكر تفضيلاتك (مثل المظهر الفاتح/الداكن).</p>

          <h2 className="text-xl font-black mt-6 mb-2">5. حقوقك</h2>
          <ul className="list-disc pr-6 space-y-1">
            <li>الوصول إلى بياناتك الشخصية وتعديلها من صفحة الملف الشخصي.</li>
            <li>طلب حذف حسابك ومحتواه.</li>
            <li>سحب الموافقة على معالجة بياناتك في أي وقت.</li>
            <li>تقديم شكوى للجهة المختصة في بلدك.</li>
          </ul>

          <h2 className="text-xl font-black mt-6 mb-2">6. أمان البيانات</h2>
          <p>نطبق إجراءات تقنية وتنظيمية متقدمة (تشفير TLS، صلاحيات RLS على مستوى قاعدة البيانات، وتخزين كلمات المرور بصيغة مُشفّرة لا يمكن استرجاعها).</p>

          <h2 className="text-xl font-black mt-6 mb-2">7. الأطفال</h2>
          <p>المنصة موجّهة للبالغين. لا نجمع بيانات الأطفال دون 18 عاماً عمداً.</p>

          <h2 className="text-xl font-black mt-6 mb-2">8. التحديثات</h2>
          <p>قد نُحدّث هذه السياسة من وقت لآخر، وسننبّهك عند أي تغييرات جوهرية.</p>
        </div>
      </div>
      <SiteFooter />
      <FloatingContact />
    </div>
  );
}
