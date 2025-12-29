
export interface SwotData {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface SmartObjective {
  id: string;
  goalIndex: number;
  text: string;
}

export interface Task {
  id: string;
  objectiveId: string;
  description: string;
  resources: string;
  responsibility: string;
  timeline: string;
}

export interface WorkPlanData {
  selfContext: string; // Background/Environment
  swot: SwotData;
  vision: string;
  highLevelGoals: string[];
  objectives: SmartObjective[];
  tasks: Task[];
  constraints: string;
}

export enum Step {
  CONTEXT = 0,
  SWOT = 1,
  VISION = 2,
  GOALS = 3,
  OBJECTIVES = 4,
  TASKS = 5,
  CONSTRAINTS = 6,
  SUMMARY = 7
}

export const STEP_NAMES = [
  'מיפוי ורקע',
  'ניתוח SWOT',
  'חזון השירות',
  'מטרות אסטרטגיות',
  'יעדי SMART',
  'תכנית ביצוע',
  'אילוצים וסיכונים',
  'לוח בקרה סופי'
];

export interface StepGuidance {
  title: string;
  description: string;
  howTo: string;
  example: string;
}

export const METHODOLOGY_GUIDANCE: Record<number, StepGuidance> = {
  [Step.CONTEXT]: {
    title: 'איפה אנחנו היום?',
    description: 'הבנת הסביבה והרקע היא הבסיס לכל תוכנית עבודה רלוונטית.',
    howTo: 'תאר את המציאות הנוכחית: מה מעסיק את היחידה? מה השתנה בסביבה העירונית/חינוכית?',
    example: 'דוגמה: "עלייה בביקוש למענה בחינוך המיוחד לצד שינוי במיקוד העירוני לרווחה."'
  },
  [Step.SWOT]: {
    title: 'ניתוח SWOT',
    description: 'כלי למיפוי הכוחות הפועלים בתוך ומחוץ לשפ"ח.',
    howTo: 'חוזקות וחולשות הן פנימיות. הזדמנויות ואיומים הם חיצוניים.',
    example: 'דוגמה: הזדמנות - פתיחת מרכז חוסן עירוני חדש.'
  },
  [Step.VISION]: {
    title: 'איך מנסחים חזון?',
    description: 'חזון הוא תמונת העתיד הרצויה. הוא צריך להיות קצר, קליט ומעורר השראה.',
    howTo: 'השתמש בפעלים בזמן הווה או עתיד. חשוב על הערך המרכזי שאתם מביאים לקהילה.',
    example: 'דוגמה: "שפ״ח מוביל, המהווה מוקד ידע וחוסן עבור כל ילד וצוות חינוכי בעיר."'
  },
  [Step.GOALS]: {
    title: 'מטרות אסטרטגיות',
    description: 'המטרות הן אבני הדרך להגשמת החזון.',
    howTo: 'נסח מטרות רחבות שמגדירות שינוי או שיפור בתחום ספציפי.',
    example: 'דוגמה: "הטמעת מודל עבודה קהילתי-מניעתי בכל בתי הספר היסודיים."'
  },
  [Step.OBJECTIVES]: {
    title: 'יעדי SMART',
    description: 'יעד הוא פירוט של מטרה למשהו מדיד וקונקרטי.',
    howTo: 'ודא שהיעד ספציפי (S), מדיד (M), בר-השגה (A), רלוונטי (R) ותחום בזמן (T).',
    example: 'דוגמה: "בניית תוכנית השתלמות ל-5 צוותי יועצות עד דצמבר 2024."'
  },
  [Step.TASKS]: {
    title: 'תכנית ביצוע (Action Items)',
    description: 'כאן התוכנית הופכת למציאות.',
    howTo: 'פרק כל יעד למשימות קטנות. הגדר מי האחראי, מה הלו"ז ומה המשאבים הנדרשים.',
    example: 'דוגמה: "משימה: איסוף חומרים להשתלמות. אחראי: רכזת קהילה. לו"ז: שבועיים."'
  },
  [Step.CONSTRAINTS]: {
    title: 'ניהול אילוצים',
    description: 'זיהוי מראש של מה שעלול להשתבש.',
    howTo: 'חשוב על חסמי כוח אדם, תקציב או שינויים פוליטיים בלתי צפויים.',
    example: 'דוגמה: "עיכוב אפשרי בקבלת תקציב חיצוני לפרויקט המניעה."'
  }
};

export interface WorkshopQuestionSet {
  title: string;
  questions: string[];
}

export const WORKSHOP_STOPS: Record<number, WorkshopQuestionSet> = {
  [Step.VISION]: {
    title: 'מחשבה על העתיד',
    questions: [
      'מה הדבר האחד שהיית רוצה שיגידו על השפ"ח שלך בעוד 3 שנים?',
      'מה המילה שמתארת הכי טוב את הייעוד המקצועי שלכם השנה?',
    ]
  },
  [Step.GOALS]: {
    title: 'מיקוד המאמץ',
    questions: [
      'מתוך כל האתגרים, אילו 3 נושאים הם הקריטיים ביותר השנה?',
      'איפה נמצא הפער הכי גדול בין המצוי לרצוי בשירות שלכם?',
    ]
  },
  [Step.TASKS]: {
    title: 'מהחזון לשטח',
    questions: [
      'מי בצוות שלך הוא ה"מנוע" שיכול להניע את המשימות האלו?',
      'מה הדבר הראשון שתעשה ביום ראשון בבוקר כדי להתחיל?',
    ]
  }
};
