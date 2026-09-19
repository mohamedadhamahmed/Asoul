// البيانات الافتراضية الأولية لنظام ساس العوائل السعودية (Phase 1 Simulation)

const INITIAL_DATA = {
    // تعريف باقات الاشتراك الساس
    pricingTiers: [
        { id: 'tier-1', name: 'باقة العائلة البسيطة', min: 1, max: 100, price: 200, period: 'سنوياً', color: 'emerald', badge: '1 - 100 فرد' },
        { id: 'tier-2', name: 'باقة العائلة الممتدة', min: 101, max: 1000, price: 400, period: 'سنوياً', color: 'amber', badge: '101 - 1,000 فرد' },
        { id: 'tier-3', name: 'باقة القبيلة والكيانات الكبرى', min: 1001, max: 10000, price: 600, period: 'سنوياً', color: 'purple', badge: '1,001 - 10,000 فرد' }
    ],

    // قائمة بيئات العوائل (Multi-tenancy)
    families: [
        {
            id: 'fam-saeed',
            name: 'عائلة آل سعيد',
            city: 'الرياض - نجد',
            foundedYear: '1340 هـ',
            admin: {
                name: 'فهد بن عبد الرحمن آل سعيد',
                phone: '0551234567',
                email: 'fahad@alsaeed.sa',
                role: 'family_admin'
            },
            status: 'active',
            createdAt: '2026-01-15',
            settings: {
                requireAdminApprovalForNews: true,
                requireAdminApprovalForDocs: true,
                allowMemberInvite: true
            }
        },
        {
            id: 'fam-abdulaziz',
            name: 'عائلة آل عبد العزيز',
            city: 'جدة - الغربية',
            foundedYear: '1355 هـ',
            admin: {
                name: 'طارق بن عبد العزيز',
                phone: '0501122334',
                email: 'tariq@abdulaziz.sa',
                role: 'family_admin'
            },
            status: 'active',
            createdAt: '2026-02-01',
            settings: {
                requireAdminApprovalForNews: true,
                requireAdminApprovalForDocs: true,
                allowMemberInvite: true
            }
        }
    ],

    // أفراد المشجرة لعائلة آل سعيد
    members: [
        {
            id: 'm-1',
            familyId: 'fam-saeed',
            name: 'الشيخ عبد الرحمن بن سعيد آل سعيد',
            title: 'مؤسس الفرع رحمه الله',
            gender: 'male',
            generation: 1,
            parentId: null,
            phone: '',
            status: 'deceased',
            isAlive: false,
            city: 'الرياض',
            job: 'تاجر وأحد رجالات نجد',
            bio: 'رحمه الله، ولد عام 1315هـ في الرياض وكان من وجهاء المجتمع ومن أهل الخير والمروءة.'
        },
        {
            id: 'm-2',
            familyId: 'fam-saeed',
            name: 'فهد بن عبد الرحمن آل سعيد',
            title: 'عميد العائلة (المسؤول)',
            gender: 'male',
            generation: 2,
            parentId: 'm-1',
            phone: '0551234567',
            status: 'active',
            isAlive: true,
            city: 'الرياض',
            job: 'مستشار إداري وأعمال حرة',
            bio: 'أدمن العائلة ومسؤول الشجرة والصندوق العائلي.'
        },
        {
            id: 'm-3',
            familyId: 'fam-saeed',
            name: 'عبد العزيز بن عبد الرحمن آل سعيد',
            title: 'أبو محمد',
            gender: 'male',
            generation: 2,
            parentId: 'm-1',
            phone: '0505566778',
            status: 'active',
            isAlive: true,
            city: 'الخبر',
            job: 'مهندس بترول متقاعد',
            bio: 'مقيم بالمنطقة الشرقية، متابع لشؤون الأسرة.'
        },
        {
            id: 'm-4',
            familyId: 'fam-saeed',
            name: 'إبراهيم بن عبد الرحمن آل سعيد',
            title: 'أبو سعود',
            gender: 'male',
            generation: 2,
            parentId: 'm-1',
            phone: '0543322110',
            status: 'active',
            isAlive: true,
            city: 'الرياض',
            job: 'أكاديمي وأستاذ جامعي',
            bio: 'عضو مجلس إدارة الصندوق العائلي.'
        },
        {
            id: 'm-5',
            familyId: 'fam-saeed',
            name: 'نورة بنت عبد الرحمن آل سعيد',
            title: 'أم عبد الله',
            gender: 'female',
            generation: 2,
            parentId: 'm-1',
            phone: '0567788990',
            status: 'active',
            isAlive: true,
            city: 'الرياض',
            job: 'تربوية ومربية أجيال',
            bio: 'مهتمة بتوثيق تاريخ الأسرة وشاعرة العائلة.'
        },
        {
            id: 'm-6',
            familyId: 'fam-saeed',
            name: 'فيصل بن فهد آل سعيد',
            title: 'شاب نشط بالعائلة',
            gender: 'male',
            generation: 3,
            parentId: 'm-2',
            phone: '0509876543',
            status: 'active',
            isAlive: true,
            city: 'الرياض',
            job: 'رائد أعمال تقني',
            bio: 'مطور برمجيات ومهتم بأرشفة تاريخ العائلة الرقمي.'
        },
        {
            id: 'm-7',
            familyId: 'fam-saeed',
            name: 'سلطان بن فهد آل سعيد',
            title: 'طالب جامعي',
            gender: 'male',
            generation: 3,
            parentId: 'm-2',
            phone: '0541122334',
            status: 'invited', // تم إرسال دعوة ولم يسجل بعد
            isAlive: true,
            city: 'الرياض',
            job: 'طالب بكلية الطب - جامعة الملك سعود',
            bio: 'تمت دعوته عبر واتساب للاشتراك بالبوابة.'
        },
        {
            id: 'm-8',
            familyId: 'fam-saeed',
            name: 'ريم بنت فهد آل سعيد',
            title: 'مهندسة تصميم',
            gender: 'female',
            generation: 3,
            parentId: 'm-2',
            phone: '0565544332',
            status: 'active',
            isAlive: true,
            city: 'الرياض',
            job: 'مصممة ديكور ومعمار',
            bio: 'عضو نشط في لجان الفعاليات العائلية.'
        },
        {
            id: 'm-9',
            familyId: 'fam-saeed',
            name: 'د. محمد بن عبد العزيز آل سعيد',
            title: 'استشاري جراحة',
            gender: 'male',
            generation: 3,
            parentId: 'm-3',
            phone: '0533344556',
            status: 'active',
            isAlive: true,
            city: 'الدمام',
            job: 'استشاري جراحة قلب',
            bio: 'حاصل حديثاً على البورد الكندي.'
        },
        {
            id: 'm-10',
            familyId: 'fam-saeed',
            name: 'سعود بن إبراهيم آل سعيد',
            title: 'محامي ومستشار قانوني',
            gender: 'male',
            generation: 3,
            parentId: 'm-4',
            phone: '0512233445',
            status: 'invited',
            isAlive: true,
            city: 'الرياض',
            job: 'محامي معتمد',
            bio: 'عضو اللجنة القانونية للأوقاف العائلية.'
        },
        {
            id: 'm-11',
            familyId: 'fam-saeed',
            name: 'ريان بن فيصل آل سعيد',
            title: 'الجيل الرابع (طفل)',
            gender: 'male',
            generation: 4,
            parentId: 'm-6',
            phone: '',
            status: 'active',
            isAlive: true,
            city: 'الرياض',
            job: 'طفل مبارك',
            bio: 'مولود جديد تمت إضافته مؤخراً في المشجرة.'
        }
    ],

    // أعضاء عائلة آل عبد العزيز (لإظهار باقة 145 عضو التلقائية للعميل)
    extraFamilyCount: {
        'fam-abdulaziz': 145 // أكثر من 100 حتى تظهر الباقة الذهبية 400 ريال تلقائياً
    },

    // أخبار ومناسبات العائلة
    news: [
        {
            id: 'n-1',
            familyId: 'fam-saeed',
            title: 'حفل زواج الشاب فيصل بن فهد آل سعيد',
            category: 'زواج',
            authorName: 'فهد بن عبد الرحمن آل سعيد',
            authorRole: 'أدمن العائلة',
            date: '2026-03-10',
            content: 'يسرنا دعوتكم لحضور حفل زواج ابننا فيصل بن فهد، وذلك بمشيئة الله تعالى مساء يوم الجمعة بقاعة الدرعية للاحتفالات بالرياض. مرحباً بالجميع.',
            status: 'approved',
            createdAt: '2026-03-01 14:30'
        },
        {
            id: 'n-2',
            familyId: 'fam-saeed',
            title: 'اللقاء العائلي السنوي في مخيم الثمامة',
            category: 'لقاء عائلي',
            authorName: 'إبراهيم بن عبد الرحمن آل سعيد',
            authorRole: 'عضو مجلس العائلة',
            date: '2026-02-20',
            content: 'نلتقي بإذن الله في اللقاء الدوري السنوي للأسرة الكريمة يوم السبت القادم، ويتخلل اللقاء مسابقات للصغار وتكريم حفظة القرآن والمتفوقين.',
            status: 'approved',
            createdAt: '2026-02-15 10:00'
        },
        {
            id: 'n-3',
            familyId: 'fam-saeed',
            title: 'تكريم الدكتور محمد بن عبد العزيز لحصوله على البورد الكندي',
            category: 'إنجاز وتكريم',
            authorName: 'فيصل بن فهد آل سعيد',
            authorPhone: '0509876543',
            authorRole: 'فرد من العائلة',
            date: '2026-03-18',
            content: 'نبارك لابن العم د. محمد بن عبد العزيز حصوله على زمالة البورد الكندي في جراحة القلب بمرتبة الشرف، سائلين الله له دوام التوفيق والرفعة.',
            status: 'pending', // بانتظار موافقة الأدمن
            createdAt: '2026-03-18 09:15'
        },
        {
            id: 'n-4',
            familyId: 'fam-saeed',
            title: 'بشرى بقدوم المولود الجديد "ريان" لفيصل آل سعيد',
            category: 'مولود جديد',
            authorName: 'فيصل بن فهد آل سعيد',
            authorPhone: '0509876543',
            authorRole: 'فرد من العائلة',
            date: '2026-03-12',
            content: 'رزق الله الأخ فيصل بمولود اتفق على تسميته (ريان)، جعله الله من مواليد السعادة والبركة وقرة عين لوالديه.',
            status: 'pending', // بانتظار موافقة الأدمن
            createdAt: '2026-03-17 18:40'
        }
    ],

    // وثائق وأرشيف العائلة
    documents: [
        {
            id: 'd-1',
            familyId: 'fam-saeed',
            title: 'صك وقف خيري وبستان النخيل بالدرعية 1362هـ',
            category: 'صكوك وأوقاف',
            authorName: 'فهد بن عبد الرحمن آل سعيد',
            authorRole: 'أدمن العائلة',
            fileType: 'pdf',
            icon: 'fa-file-shield',
            size: '3.4 MB',
            date: '2026-01-20',
            status: 'approved',
            description: 'وثيقة شرعية قديمة ومحفوظة لوقف الجد عبد الرحمن بن سعيد رحمه الله والمخصص لأعمال البر وذرية العائلة.'
        },
        {
            id: 'd-2',
            familyId: 'fam-saeed',
            title: 'صورة تاريخية نادرة للشيخ عبد الرحمن آل سعيد عام 1378هـ',
            category: 'صور تاريخية',
            authorName: 'نورة بنت عبد الرحمن آل سعيد',
            authorRole: 'فرد من العائلة',
            fileType: 'image',
            icon: 'fa-image',
            size: '5.1 MB',
            date: '2026-02-10',
            status: 'approved',
            description: 'صورة نادرة بالأبيض والأسود تجمع كبار أعيان الرياض في مناسبة رسمية.'
        },
        {
            id: 'd-3',
            familyId: 'fam-saeed',
            title: 'مخطوطة شجرة النسب العائلية المكتوبة بمداد الزعفران',
            category: 'مخطوطات النسب',
            authorName: 'فيصل بن فهد آل سعيد',
            authorPhone: '0509876543',
            authorRole: 'فرد من العائلة',
            fileType: 'image',
            icon: 'fa-scroll',
            size: '4.8 MB',
            date: '2026-03-18',
            status: 'pending', // بانتظار موافقة الأدمن
            description: 'مخطوطة ورقية قديمة تعود لأكثر من 90 عاماً توضح تفرع الأجداد تم تصويرها بدقة عالية للأرشفة الإلكترونية.'
        }
    ],

    // سجل العمليات والأنشطة الحيوية (Activity Log)
    activities: [
        {
            id: 'act-1',
            familyId: 'fam-saeed',
            userName: 'فيصل بن فهد آل سعيد',
            action: 'قدم وثيقة تاريخية للاعتماد (مخطوطة شجرة النسب)',
            category: 'doc',
            time: 'منذ ساعتين',
            icon: 'fa-file-arrow-up',
            color: 'blue'
        },
        {
            id: 'act-2',
            familyId: 'fam-saeed',
            userName: 'فيصل بن فهد آل سعيد',
            action: 'أضاف خبراً جديداً بانتظار الاعتماد (تكريم د. محمد)',
            category: 'news',
            time: 'منذ 4 ساعات',
            icon: 'fa-bullhorn',
            color: 'amber'
        },
        {
            id: 'act-3',
            familyId: 'fam-saeed',
            userName: 'فهد بن عبد الرحمن آل سعيد (الأدمن)',
            action: 'أرسل دعوة انضمام عبر واتساب للعضو: سلطان بن فهد',
            category: 'invite',
            time: 'أمس 04:30 م',
            icon: 'fa-paper-plane',
            color: 'emerald'
        },
        {
            id: 'act-4',
            familyId: 'fam-saeed',
            userName: 'ريم بنت فهد آل سعيد',
            action: 'أكملت تسجيل الدخول وحدثت بياناتها الشخصية',
            category: 'auth',
            time: 'أمس 01:15 م',
            icon: 'fa-user-check',
            color: 'indigo'
        },
        {
            id: 'act-5',
            familyId: 'fam-saeed',
            userName: 'فهد بن عبد الرحمن آل سعيد (الأدمن)',
            action: 'اعتمد نشر خبر حفل زواج فيصل في ساحة العائلة',
            category: 'approval',
            time: 'منذ 3 أيام',
            icon: 'fa-check-double',
            color: 'emerald'
        }
    ]
};
