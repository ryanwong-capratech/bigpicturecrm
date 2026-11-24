import { forwardRef } from "react";

interface Student {
  id: number;
  nickname?: string | null;
  fullNameChinese?: string | null;
  gender?: string | null;
  photoUrl?: string | null;
  birthday?: string | null;
  igFb?: string | null;
  email?: string | null;
  phone?: string | null;
  favoriteSongs?: string | null;
  businessModel?: string | null;
  partnersEmployees?: string | null;
  companyInfo?: string | null;
  nextGoal?: string | null;
  businessBottleneck?: string | null;
  wantToImprove?: string | null;
  mainIncome?: string | null;
  mainExpense?: string | null;
  incomeLevel?: string | null;
  financialSatisfaction?: string | null;
  financialControl?: string | null;
  maritalStatus?: string | null;
  familyMembers?: string | null;
  mostImportantPerson?: string | null;
  whyJoin?: string | null;
  courseExpectation?: string | null;
  wantToTakeAway?: string | null;
  otherCourses?: string | null;
  interestedWorkshops?: string | null;
  attendanceConfirmed?: string | null;
}

interface CustomField {
  id: number;
  label: string;
  groupName?: string | null;
}

interface CustomValue {
  fieldId: number;
  value: string | null;
}

interface Props {
  student: Student;
  customFields?: CustomField[];
  customValues?: CustomValue[];
}

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div style={{ marginBottom: "6px" }}>
      <span style={{ fontSize: "9px", color: "#b8922a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {label}
      </span>
      <div style={{ fontSize: "11px", color: "#1a1a1a", lineHeight: "1.4", marginTop: "2px" }}>
        {value}
      </div>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div style={{
      fontSize: "9px",
      fontWeight: 700,
      color: "#b8922a",
      textTransform: "uppercase",
      letterSpacing: "0.12em",
      borderBottom: "1px solid #e8d5a3",
      paddingBottom: "4px",
      marginBottom: "8px",
      marginTop: "12px",
    }}>
      {title}
    </div>
  );
}

const StudentPdfTemplate = forwardRef<HTMLDivElement, Props>(
  ({ student, customFields = [], customValues = [] }, ref) => {
    const displayName = student.nickname || student.fullNameChinese || "未命名";
    const getCustomValue = (fieldId: number) =>
      customValues.find((v) => v.fieldId === fieldId)?.value;

    // Group custom fields by groupName
    const customByGroup: Record<string, CustomField[]> = {};
    customFields.forEach((f) => {
      const g = f.groupName || "其他";
      if (!customByGroup[g]) customByGroup[g] = [];
      customByGroup[g].push(f);
    });

    return (
      <div
        ref={ref}
        style={{
          width: "794px",       // A4 at 96dpi
          minHeight: "1123px",
          backgroundColor: "#faf8f3",
          fontFamily: "'Noto Sans TC', 'PingFang TC', 'Microsoft JhengHei', sans-serif",
          position: "relative",
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        {/* Gold top bar */}
        <div style={{ height: "6px", background: "linear-gradient(90deg, #b8922a, #d4af6a, #b8922a)" }} />

        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #1a1208 0%, #2d2010 50%, #1a1208 100%)",
          padding: "24px 32px 20px",
          display: "flex",
          alignItems: "flex-end",
          gap: "24px",
        }}>
          {/* Photo */}
          <div style={{
            width: "140px",
            height: "180px",
            borderRadius: "10px",
            overflow: "hidden",
            border: "3px solid #b8922a",
            flexShrink: 0,
            backgroundColor: "#2d2010",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            {student.photoUrl ? (
              <img
                src={student.photoUrl}
                alt={displayName}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                crossOrigin="anonymous"
              />
            ) : (
              <span style={{ fontSize: "48px", color: "#b8922a", fontWeight: 700 }}>
                {displayName[0]}
              </span>
            )}
          </div>

          {/* Name block */}
          <div style={{ flex: 1, paddingBottom: "4px" }}>
            <div style={{ fontSize: "8px", color: "#b8922a", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "6px" }}>
              格局17 · Coach Portal
            </div>
            <div style={{
              fontSize: "32px",
              fontWeight: 700,
              color: "#f5e9c8",
              lineHeight: 1.1,
              fontFamily: "'Playfair Display', 'Noto Serif TC', serif",
              marginBottom: "6px",
            }}>
              {displayName}
            </div>
            {student.fullNameChinese && student.nickname && (
              <div style={{ fontSize: "16px", color: "#c9a84c", marginBottom: "10px" }}>
                {student.fullNameChinese}
              </div>
            )}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {student.gender && (
                <span style={{
                  fontSize: "10px",
                  padding: "3px 10px",
                  borderRadius: "20px",
                  background: student.gender === "男" ? "rgba(59,130,246,0.25)" : "rgba(236,72,153,0.25)",
                  color: student.gender === "男" ? "#93c5fd" : "#f9a8d4",
                  border: `1px solid ${student.gender === "男" ? "rgba(59,130,246,0.4)" : "rgba(236,72,153,0.4)"}`,
                }}>
                  {student.gender}
                </span>
              )}
              {student.attendanceConfirmed && (
                <span style={{
                  fontSize: "10px",
                  padding: "3px 10px",
                  borderRadius: "20px",
                  background: "rgba(184,146,42,0.2)",
                  color: "#d4af6a",
                  border: "1px solid rgba(184,146,42,0.4)",
                }}>
                  {student.attendanceConfirmed}
                </span>
              )}
              {student.businessModel && (
                <span style={{
                  fontSize: "10px",
                  padding: "3px 10px",
                  borderRadius: "20px",
                  background: "rgba(255,255,255,0.08)",
                  color: "#e5d5a8",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}>
                  {student.businessModel}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Gold divider */}
        <div style={{ height: "2px", background: "linear-gradient(90deg, transparent, #b8922a 20%, #d4af6a 50%, #b8922a 80%, transparent)" }} />

        {/* Content area */}
        <div style={{ padding: "20px 32px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 28px" }}>

          {/* Left column */}
          <div>
            <SectionTitle title="基本資料" />
            <Field label="中文全名" value={student.fullNameChinese} />
            <Field label="暱稱" value={student.nickname} />
            <Field label="生日" value={student.birthday} />
            <Field label="IG / FB" value={student.igFb} />
            <Field label="電郵" value={student.email} />
            <Field label="電話" value={student.phone} />
            <Field label="喜歡的歌和歌手" value={student.favoriteSongs} />

            <SectionTitle title="個人背景" />
            <Field label="婚姻/感情狀態" value={student.maritalStatus} />
            <Field label="主要家庭成員" value={student.familyMembers} />
            <Field label="最重要的人" value={student.mostImportantPerson} />

            <SectionTitle title="財政狀況" />
            <Field label="主要收入來源" value={student.mainIncome} />
            <Field label="最大開支" value={student.mainExpense} />
            <Field label="收入水平" value={student.incomeLevel} />
            <Field label="財政滿意度（1-5分）" value={student.financialSatisfaction} />
            <Field label="財政掌握度（1-5分）" value={student.financialControl} />

            {/* Custom fields for 財政狀況 */}
            {customByGroup["財政狀況"]?.map((cf) => {
              const v = getCustomValue(cf.id);
              return v ? <Field key={cf.id} label={cf.label} value={v} /> : null;
            })}
          </div>

          {/* Right column */}
          <div>
            <SectionTitle title="生意資訊" />
            <Field label="生意模式" value={student.businessModel} />
            <Field label="拍檔及員工數" value={student.partnersEmployees} />
            <Field label="公司名稱及網址" value={student.companyInfo} />
            {customByGroup["生意資訊"]?.map((cf) => {
              const v = getCustomValue(cf.id);
              return v ? <Field key={cf.id} label={cf.label} value={v} /> : null;
            })}

            <SectionTitle title="目標與瓶頸" />
            <Field label="下一個目標/遠景" value={student.nextGoal} />
            <Field label="生意瓶頸" value={student.businessBottleneck} />
            <Field label="想提升的方面" value={student.wantToImprove} />

            <SectionTitle title="課程相關" />
            <Field label="為什麼來上格局" value={student.whyJoin} />
            <Field label="課程期望" value={student.courseExpectation} />
            <Field label="希望帶走什麼" value={student.wantToTakeAway} />
            <Field label="其他課程經歷" value={student.otherCourses} />
            <Field label="有興趣的 Workshop" value={student.interestedWorkshops} />
            <Field label="出席安排" value={student.attendanceConfirmed} />
            {customByGroup["課程相關"]?.map((cf) => {
              const v = getCustomValue(cf.id);
              return v ? <Field key={cf.id} label={cf.label} value={v} /> : null;
            })}

            {/* Other custom fields */}
            {Object.entries(customByGroup)
              .filter(([g]) => !["基本資料", "個人背景", "生意資訊", "目標與瓶頸", "財政狀況", "課程相關"].includes(g))
              .map(([groupName, fields]) => (
                <div key={groupName}>
                  <SectionTitle title={groupName} />
                  {fields.map((cf) => {
                    const v = getCustomValue(cf.id);
                    return v ? <Field key={cf.id} label={cf.label} value={v} /> : null;
                  })}
                </div>
              ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "10px 32px",
          background: "linear-gradient(0deg, #1a1208 0%, transparent 100%)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <span style={{ fontSize: "8px", color: "#7a6030", letterSpacing: "0.1em" }}>
            格局17 · CONFIDENTIAL
          </span>
          <span style={{ fontSize: "8px", color: "#7a6030" }}>
            ID: {student.id} · {new Date().toLocaleDateString("zh-HK")}
          </span>
        </div>
      </div>
    );
  }
);

StudentPdfTemplate.displayName = "StudentPdfTemplate";
export default StudentPdfTemplate;
