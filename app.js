// محرك ومنطق نظام ساس إدارة العوائل السعودية (Phase 1 Simulation)

const App = {
    // حالة النظام الحالية
    state: {
        role: 'owner', // 'owner' | 'admin' | 'member'
        activeFamilyId: 'fam-saeed',
        currentAdminTab: 'tree',
        currentMember: null, // العضو المسجل دخوله حالياً
        generatedOtp: null,
        data: null
    },

    // تهيئة النظام عند تحميل الصفحة
    init() {
        this.loadState();
        this.populateFamilySelector();

        // قراءة المعاملات من الرابط (Base URL Query Parameters) لدعم روابط الدعوات والتسليم
        const urlParams = new URLSearchParams(window.location.search);
        const famParam = urlParams.get('fam');
        const roleParam = urlParams.get('role');
        const phoneParam = urlParams.get('phone');

        if (famParam && this.state.data.families.some(f => f.id === famParam)) {
            this.state.activeFamilyId = famParam;
            this.populateFamilySelector();
        }

        if (phoneParam) {
            this.state.role = 'member';
            setTimeout(() => {
                const phoneInput = document.getElementById('memberPhoneInput');
                if (phoneInput) {
                    phoneInput.value = phoneParam;
                    this.showToast(`مرحباً بك! تم التعرف على رقم جوالك (${phoneParam}). اضغط إرسال رمز التحقق للدخول.`, 'info');
                }
            }, 300);
        } else if (roleParam && ['owner', 'admin', 'member'].includes(roleParam)) {
            this.state.role = roleParam;
        }

        this.renderCurrentRole();
        this.updateAdminBadge();

        if (!phoneParam) {
            // إشعار ترحيبي
            setTimeout(() => {
                this.showToast('مرحباً بك في النسخة التجريبية لنظام ساس العوائل السعودية (Phase 1)', 'info');
            }, 600);
        }
    },

    // الحصول على رابط النظام الأساسي الفعلي (Base URL) ديناميكياً
    getBaseUrl() {
        const custom = localStorage.getItem('saudi_family_custom_base_url');
        if (custom && custom.trim() !== '') {
            return custom.trim().replace(/\/$/, '');
        }
        // استخراج الرابط الفعلي الحالي من المتصفح بدون استعلام أو تجزئة
        return window.location.href.split('?')[0].split('#')[0];
    },

    handleBaseUrlChange(newUrl) {
        if (newUrl && newUrl.trim() !== '') {
            localStorage.setItem('saudi_family_custom_base_url', newUrl.trim());
        } else {
            localStorage.removeItem('saudi_family_custom_base_url');
        }
        
        // تحديث النصوص في النوافذ المنبثقة فوراً
        if (this.currentHandoverFamilyId) {
            this.openHandoverModal(this.currentHandoverFamilyId);
        }
        if (this.currentInviteMember) {
            this.updateInvitePreview();
        }
    },

    // تحميل البيانات من localStorage أو استخدام البيانات الافتراضية
    loadState() {
        const saved = localStorage.getItem('saudi_family_saas_db');
        if (saved) {
            try {
                this.state.data = JSON.parse(saved);
            } catch (e) {
                console.error('Error parsing stored data', e);
                this.state.data = JSON.parse(JSON.stringify(INITIAL_DATA));
            }
        } else {
            this.state.data = JSON.parse(JSON.stringify(INITIAL_DATA));
            this.saveState();
        }
    },

    // حفظ التغييرات في localStorage
    saveState() {
        localStorage.setItem('saudi_family_saas_db', JSON.stringify(this.state.data));
    },

    // إعادة تعيين بيانات العرض التجريبية
    resetDemoData() {
        if (confirm('هل ترغب بإعادة ضبط كافة البيانات للمحاكاة الأصلية؟')) {
            localStorage.removeItem('saudi_family_saas_db');
            this.state.data = JSON.parse(JSON.stringify(INITIAL_DATA));
            this.state.activeFamilyId = 'fam-saeed';
            this.state.currentMember = null;
            this.state.role = 'owner';
            this.saveState();
            this.populateFamilySelector();
            this.renderCurrentRole();
            this.showToast('تمت إعادة ضبط البيانات الافتراضية بنجاح', 'success');
        }
    },

    // ==========================================
    // منطق الباقات وحساب التكاليف (SaaS Pricing)
    // ==========================================
    getFamilyMemberCount(familyId) {
        if (!this.state.data) return 0;
        // التحقق مما إذا كانت هناك قيمة إضافية لمحاكاة العوائل الكبرى (مثل عائلة آل عبد العزيز)
        const extra = this.state.data.extraFamilyCount && this.state.data.extraFamilyCount[familyId];
        if (extra) return extra;

        const count = this.state.data.members.filter(m => m.familyId === familyId).length;
        return count;
    },

    // تحديد باقة الساس المناسبة حسب عدد الأفراد
    calculateTier(count) {
        const tiers = this.state.data.pricingTiers;
        for (const tier of tiers) {
            if (count >= tier.min && count <= tier.max) {
                return tier;
            }
        }
        return tiers[0];
    },

    // ==========================================
    // التحكم بالأدوار والتبديل (Role Switcher)
    // ==========================================
    switchRole(newRole) {
        this.state.role = newRole;

        // تحديث أزرار الشريط العلوي
        ['owner', 'admin', 'member'].forEach(r => {
            const btn = document.getElementById(`roleBtn-${r}`);
            if (btn) {
                if (r === newRole) {
                    btn.classList.add('bg-slate-700', 'text-white', 'shadow');
                    btn.classList.remove('text-slate-300');
                } else {
                    btn.classList.remove('bg-slate-700', 'text-white', 'shadow');
                    btn.classList.add('text-slate-300');
                }
            }
        });

        // إخفاء كافة الواجهات وإظهار الواجهة المطلوبة
        document.getElementById('ownerView').classList.add('hidden');
        document.getElementById('adminView').classList.add('hidden');
        document.getElementById('memberView').classList.add('hidden');

        if (newRole === 'owner') {
            document.getElementById('ownerView').classList.remove('hidden');
            this.renderOwnerView();
        } else if (newRole === 'admin') {
            document.getElementById('adminView').classList.remove('hidden');
            this.renderAdminView();
        } else if (newRole === 'member') {
            document.getElementById('memberView').classList.remove('hidden');
            this.renderMemberView();
        }
    },

    renderCurrentRole() {
        this.switchRole(this.state.role);
    },

    // ملء قائمة العوائل في الشريط العلوي
    populateFamilySelector() {
        const sel = document.getElementById('globalFamilySelector');
        if (!sel || !this.state.data) return;
        sel.innerHTML = '';
        this.state.data.families.forEach(f => {
            const opt = document.createElement('option');
            opt.value = f.id;
            opt.textContent = `${f.name} (${f.city})`;
            if (f.id === this.state.activeFamilyId) opt.selected = true;
            sel.appendChild(opt);
        });
    },

    // تغيير العائلة النشطة
    changeActiveFamily(familyId) {
        this.state.activeFamilyId = familyId;
        this.state.currentMember = null; // إعادة تعيين العضو النشط
        this.renderCurrentRole();
        this.showToast(`تم التبديل إلى بيئة: ${this.getActiveFamily().name}`, 'info');
    },

    getActiveFamily() {
        return this.state.data.families.find(f => f.id === this.state.activeFamilyId) || this.state.data.families[0];
    },

    // ==========================================
    // سيناريو 1: واجهة أونر المنصة (Super Admin)
    // ==========================================
    renderOwnerView() {
        const families = this.state.data.families;
        const totalFamilies = families.length;
        let totalMembers = 0;
        let totalRevenue = 0;

        families.forEach(f => {
            const count = this.getFamilyMemberCount(f.id);
            totalMembers += count;
            const tier = this.calculateTier(count);
            totalRevenue += tier.price;
        });

        // تحديث الإحصائيات
        document.getElementById('statTotalFamilies').textContent = totalFamilies;
        document.getElementById('statTotalMembers').textContent = totalMembers;
        document.getElementById('statTotalRevenue').textContent = `${totalRevenue.toLocaleString()} ر.س`;

        // عرض بطاقات الباقات الثلاث
        const tiersContainer = document.getElementById('pricingTiersCards');
        tiersContainer.innerHTML = '';
        this.state.data.pricingTiers.forEach(t => {
            const card = document.createElement('div');
            card.className = `p-5 rounded-xl border border-slate-200 bg-slate-50 relative flex flex-col justify-between hover:shadow-md transition`;
            card.innerHTML = `
                <div>
                    <div class="flex items-center justify-between mb-2">
                        <span class="font-extrabold text-sm text-slate-800">${t.name}</span>
                        <span class="bg-${t.color}-100 text-${t.color}-800 text-[11px] font-black px-2 py-0.5 rounded-full border border-${t.color}-300">
                            ${t.badge}
                        </span>
                    </div>
                    <div class="flex items-baseline gap-1 my-3">
                        <span class="text-3xl font-black text-slate-900">${t.price}</span>
                        <span class="text-xs text-slate-500 font-bold">ريال سعودي / ${t.period}</span>
                    </div>
                    <ul class="text-xs text-slate-600 space-y-1.5 mb-4">
                        <li class="flex items-center gap-1.5"><i class="fa-solid fa-check text-emerald-600 text-xs"></i> قاعدة بيانات وشجرة مستقلة</li>
                        <li class="flex items-center gap-1.5"><i class="fa-solid fa-check text-emerald-600 text-xs"></i> دعوات وتفعيل WhatsApp للأفراد</li>
                        <li class="flex items-center gap-1.5"><i class="fa-solid fa-check text-emerald-600 text-xs"></i> أرشفة الوثائق والأخبار والصكوك</li>
                        <li class="flex items-center gap-1.5"><i class="fa-solid fa-check text-emerald-600 text-xs"></i> لوحة تحكم وإشراف للأدمن</li>
                    </ul>
                </div>
                <div class="text-[11px] text-slate-400 bg-white p-2 rounded-lg border border-slate-200 text-center font-semibold">
                    ترقية آلية فور بلوغ الحد
                </div>
            `;
            tiersContainer.appendChild(card);
        });

        // عرض جدول بيئات العوائل
        const tbody = document.getElementById('ownerFamiliesTableBody');
        tbody.innerHTML = '';
        families.forEach(f => {
            const count = this.getFamilyMemberCount(f.id);
            const tier = this.calculateTier(count);

            const tr = document.createElement('tr');
            tr.className = 'hover:bg-slate-50/80 transition';
            tr.innerHTML = `
                <td class="py-3.5 px-5 font-bold text-slate-800">
                    <div class="flex items-center gap-2">
                        <div class="w-8 h-8 rounded-lg bg-saudi-50 text-saudi-900 flex items-center justify-center text-sm font-black">
                            <i class="fa-solid fa-tree"></i>
                        </div>
                        <div>
                            <span>${f.name}</span>
                            <span class="block text-[10px] text-slate-400">تأسيس: ${f.foundedYear || '1350 هـ'}</span>
                        </div>
                    </div>
                </td>
                <td class="py-3.5 px-5 text-slate-600 text-xs">${f.city}</td>
                <td class="py-3.5 px-5 font-semibold text-slate-700 text-xs">${f.admin.name}</td>
                <td class="py-3.5 px-5 font-mono text-slate-600 text-xs">${f.admin.phone}</td>
                <td class="py-3.5 px-5">
                    <div class="flex items-center gap-2">
                        <span class="font-black text-slate-800 text-sm">${count}</span>
                        <span class="text-[10px] text-slate-400">فرد</span>
                    </div>
                </td>
                <td class="py-3.5 px-5">
                    <span class="bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-lg border border-emerald-200 inline-flex items-center gap-1">
                        <i class="fa-solid fa-tag text-[10px]"></i>
                        ${tier.name} (${tier.price} ر.س)
                    </span>
                </td>
                <td class="py-3.5 px-5">
                    <span class="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> مفعلة
                    </span>
                </td>
                <td class="py-3.5 px-5 text-center">
                    <div class="flex items-center justify-center gap-1.5">
                        <button onclick="App.openHandoverModal('${f.id}')" class="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2.5 py-1 rounded-lg text-xs transition flex items-center gap-1" title="بيانات تسليم الحساب">
                            <i class="fa-solid fa-key text-gold-600"></i>
                            <span>تسليم الحساب</span>
                        </button>
                        <button onclick="App.loginAsFamilyAdmin('${f.id}')" class="bg-saudi-900 hover:bg-saudi-800 text-white font-bold px-2.5 py-1 rounded-lg text-xs transition flex items-center gap-1" title="دخول البيئة كأدمن">
                            <i class="fa-solid fa-arrow-right-to-bracket"></i>
                            <span>دخول كأدمن</span>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    // فتح مودال إنشاء بيئة عائلة جديدة
    openCreateFamilyModal() {
        document.getElementById('modalCreateFamily').classList.remove('hidden');
    },

    // معالجة إنشاء بيئة عائلة جديدة
    handleCreateFamily(event) {
        event.preventDefault();
        const name = document.getElementById('newFamName').value.trim();
        const city = document.getElementById('newFamCity').value.trim();
        const year = document.getElementById('newFamYear').value.trim() || '1350 هـ';
        const adminName = document.getElementById('newFamAdminName').value.trim();
        const adminPhone = document.getElementById('newFamAdminPhone').value.trim();
        const adminEmail = document.getElementById('newFamAdminEmail').value.trim() || 'admin@family.sa';

        const familyId = 'fam-' + Date.now();
        const adminMemberId = 'm-' + Date.now();

        // إنشاء كائن العائلة الجديد
        const newFamily = {
            id: familyId,
            name,
            city,
            foundedYear: year,
            admin: {
                name: adminName,
                phone: adminPhone,
                email: adminEmail,
                role: 'family_admin'
            },
            status: 'active',
            createdAt: new Date().toISOString().split('T')[0],
            settings: {
                requireAdminApprovalForNews: true,
                requireAdminApprovalForDocs: true,
                allowMemberInvite: true
            }
        };

        // إنشاء حساب الأدمن كعضو أول في الشجرة (الجيل الثاني كمثال لمسؤول الشجرة)
        const founderMember = {
            id: 'founder-' + Date.now(),
            familyId,
            name: 'جد العائلة المؤسس رحمه الله',
            title: 'مؤسس الفرع',
            gender: 'male',
            generation: 1,
            parentId: null,
            phone: '',
            status: 'deceased',
            isAlive: false,
            city,
            job: 'رحمه الله',
            bio: 'مؤسس الشجرة والفرع العائلي'
        };

        const adminMember = {
            id: adminMemberId,
            familyId,
            name: adminName,
            title: 'مسؤول الشجرة (الأدمن)',
            gender: 'male',
            generation: 2,
            parentId: founderMember.id,
            phone: adminPhone,
            status: 'active',
            isAlive: true,
            city,
            job: 'أدمن العائلة',
            bio: 'مسؤول البيئة وإدارة أفراد الشجرة والصندوق العائلي.'
        };

        this.state.data.families.push(newFamily);
        this.state.data.members.push(founderMember, adminMember);

        // تسجيل العملية في السجل الحيوي
        this.logActivity(familyId, 'أونر المنصة', `تم إنشاء بيئة ساس جديدة: ${name} وتسليمها للأدمن ${adminName}`, 'auth', 'fa-crown', 'emerald');

        this.saveState();
        this.populateFamilySelector();
        this.closeModal('modalCreateFamily');
        this.showToast(`تم إنشاء بيئة ${name} بنجاح!`, 'success');

        // فتح بطاقة تسليم الحساب فوراً للأونر
        this.openHandoverModal(familyId);
        this.renderOwnerView();
    },

    // فتح بطاقة تسليم الحساب للأدمن
    openHandoverModal(familyId) {
        const family = this.state.data.families.find(f => f.id === familyId);
        if (!family) return;

        this.currentHandoverFamilyId = familyId;
        const baseUrl = this.getBaseUrl();
        const handoverInput = document.getElementById('handoverBaseUrlInput');
        if (handoverInput) {
            handoverInput.value = baseUrl;
        }

        const adminLoginUrl = `${baseUrl}?fam=${family.id}&role=admin`;

        const box = document.getElementById('handoverCredentialsBox');
        const text = `عزيزي ${family.admin.name}،
يسرنا إبلاغكم بأنه تم تجهيز بيئة شجرة (${family.name}) بنجاح على منصة ساس العوائل السعودية.

🔗 رابط الدخول المخصص للبيئة (مبني على Base URL):
${adminLoginUrl}

👤 اسم المستخدم / الجوال:
${family.admin.phone}

🔑 رمز المرور المؤقت:
SaudiFam@2026

📦 باقة الاشتراك الأولية:
باقة 1 - 100 فرد (200 ر.س / سنوياً) - مع ترقية تلقائية عند إضافة الأفراد.

يمكنكم البدء بإضافة أفراد الشجرة وإرسال دعوات الواتساب لهم فوراً.`;

        box.textContent = text;
        this.currentHandoverText = text;
        document.getElementById('modalHandover').classList.remove('hidden');
    },

    copyHandoverText() {
        if (this.currentHandoverText) {
            navigator.clipboard.writeText(this.currentHandoverText);
            this.showToast('تم نسخ نص رسالة التسليم بنجاح لحافظتك', 'success');
        }
    },

    loginAsFamilyAdmin(familyId) {
        this.changeActiveFamily(familyId);
        this.switchRole('admin');
    },

    // ==========================================
    // سيناريو 2: واجهة أدمن العائلة (Family Admin)
    // ==========================================
    renderAdminView() {
        const family = this.getActiveFamily();
        const members = this.state.data.members.filter(m => m.familyId === family.id);
        const count = this.getFamilyMemberCount(family.id);
        const tier = this.calculateTier(count);

        // ترويسة الأدمن
        document.getElementById('adminFamilyTitle').textContent = family.name;
        document.getElementById('adminNameDisplay').textContent = family.admin.name;
        document.getElementById('adminPhoneDisplay').textContent = family.admin.phone;

        // شريط الباقة والتقدم
        const percent = Math.min(100, Math.round((count / tier.max) * 100));
        document.getElementById('adminTierBadge').textContent = `${tier.name} (${tier.price} ر.س / ${tier.period})`;
        document.getElementById('adminTierProgressText').textContent = `${count} من ${tier.max} فرد مستخدمين (${percent}%)`;
        document.getElementById('adminTierProgressBar').style.width = `${percent}%`;

        // إحصائيات الداشبورد
        const pendingNews = this.state.data.news.filter(n => n.familyId === family.id && n.status === 'pending');
        const pendingDocs = this.state.data.documents.filter(d => d.familyId === family.id && d.status === 'pending');
        const invitedMembers = members.filter(m => m.status === 'invited');

        document.getElementById('adminStatMembersCount').textContent = count;
        document.getElementById('adminStatPendingNews').textContent = pendingNews.length;
        document.getElementById('adminStatPendingDocs').textContent = pendingDocs.length;
        document.getElementById('adminStatInvitedCount').textContent = invitedMembers.length;

        // شارات التنبيه
        const totalPending = pendingNews.length + pendingDocs.length;
        document.getElementById('adminApprovalsBadge').textContent = totalPending;
        document.getElementById('pendingNewsCountBadge').textContent = `${pendingNews.length} طلب`;
        document.getElementById('pendingDocsCountBadge').textContent = `${pendingDocs.length} طلب`;

        // تحديث محتوى التبويب النشط للأدمن
        this.renderAdminTabContent();
        this.updateAdminBadge();
    },

    switchAdminTab(tabName) {
        this.state.currentAdminTab = tabName;
        ['tree', 'approvals', 'feed', 'logs'].forEach(t => {
            const btn = document.getElementById(`adminTabBtn-${t}`);
            const content = document.getElementById(`adminTabContent-${t}`);
            if (t === tabName) {
                btn.className = 'px-4 py-3 text-xs font-bold rounded-t-xl transition border-b-2 border-emerald-600 text-emerald-700 bg-white flex items-center gap-2';
                content.classList.remove('hidden');
            } else {
                btn.className = 'px-4 py-3 text-xs font-bold rounded-t-xl transition text-slate-500 hover:text-slate-800 flex items-center gap-2';
                content.classList.add('hidden');
            }
        });
        this.renderAdminTabContent();
    },

    renderAdminTabContent() {
        const tab = this.state.currentAdminTab;
        const family = this.getActiveFamily();
        const members = this.state.data.members.filter(m => m.familyId === family.id);

        if (tab === 'tree') {
            this.renderVisualFamilyTree(members);
            this.renderAdminMembersTable(members);
        } else if (tab === 'approvals') {
            this.renderAdminApprovals(family.id);
        } else if (tab === 'feed') {
            this.renderAdminFeed(family.id);
        } else if (tab === 'logs') {
            this.renderAdminLogs(family.id);
        }
    },

    // رسم المشجرة التفاعلية بحسب الأجيال
    renderVisualFamilyTree(members) {
        const container = document.getElementById('visualFamilyTreeContainer');
        container.innerHTML = '';

        // تجميع الأعضاء حسب الجيل (Generation)
        const generations = {};
        members.forEach(m => {
            const gen = m.generation || 1;
            if (!generations[gen]) generations[gen] = [];
            generations[gen].push(m);
        });

        const genTitles = {
            1: 'الأجداد والمؤسسون (الجيل الأول)',
            2: 'الأبناء والعمداء (الجيل الثاني)',
            3: 'الأحفاد والشباب (الجيل الثالث)',
            4: 'أبناء الأحفاد والبراعم (الجيل الرابع)'
        };

        const genKeys = Object.keys(generations).sort((a, b) => a - b);

        genKeys.forEach(genNum => {
            const genDiv = document.createElement('div');
            genDiv.className = 'mb-8 last:mb-0';

            const titleH = document.createElement('div');
            titleH.className = 'text-center mb-4';
            titleH.innerHTML = `
                <span class="bg-slate-100 border border-slate-200 text-slate-700 text-xs font-black px-4 py-1.5 rounded-full inline-flex items-center gap-1.5 shadow-sm">
                    <i class="fa-solid fa-layer-group text-emerald-600"></i>
                    ${genTitles[genNum] || `الجيل رقم ${genNum}`}
                </span>
            `;
            genDiv.appendChild(titleH);

            const levelDiv = document.createElement('div');
            levelDiv.className = 'tree-level flex-wrap';

            generations[genNum].forEach(member => {
                const nodeCard = document.createElement('div');
                let statusClass = member.isAlive === false ? 'deceased' : (member.status === 'invited' ? 'invited-member' : 'active-member');
                let statusBadge = member.isAlive === false 
                    ? '<span class="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-bold">رحمه الله</span>'
                    : (member.status === 'invited' 
                        ? '<span class="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">بانتظار التفعيل</span>'
                        : '<span class="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">نشط</span>');

                nodeCard.className = `tree-node-card ${statusClass} bg-white rounded-xl p-4 shadow-sm w-56 text-right cursor-pointer`;
                nodeCard.innerHTML = `
                    <div class="flex items-start justify-between gap-2 mb-2">
                        <div class="w-9 h-9 rounded-xl ${member.gender === 'female' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700'} flex items-center justify-center text-sm font-bold border border-slate-100">
                            <i class="fa-solid ${member.gender === 'female' ? 'fa-person-dress' : 'fa-person'}"></i>
                        </div>
                        ${statusBadge}
                    </div>
                    <h5 class="font-black text-slate-800 text-xs truncate" title="${member.name}">${member.name}</h5>
                    <p class="text-[10px] text-slate-500 font-semibold mt-0.5 truncate">${member.title || member.job || 'فرد من العائلة'}</p>
                    ${member.phone ? `<p class="text-[10px] font-mono text-slate-400 mt-1">${member.phone}</p>` : ''}
                    
                    <div class="flex items-center gap-1 mt-3 pt-2 border-t border-slate-100">
                        ${member.isAlive !== false ? `
                            <button onclick="event.stopPropagation(); App.openAddMemberUnder('${member.id}')" class="flex-1 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 text-[10px] font-bold py-1 px-1.5 rounded border border-slate-200 transition text-center" title="إضافة ابن لهذا الشخص">
                                + إضافة ابن
                            </button>
                            ${member.phone ? `
                                <button onclick="event.stopPropagation(); App.openInviteForMember('${member.id}')" class="bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 text-[10px] font-bold p-1 rounded border border-emerald-200 transition" title="دعوة واتساب">
                                    <i class="fa-brands fa-whatsapp text-xs"></i>
                                </button>
                            ` : ''}
                        ` : '<span class="text-[10px] text-slate-400 text-center w-full">الجد المؤسس</span>'}
                    </div>
                `;
                levelDiv.appendChild(nodeCard);
            });

            genDiv.appendChild(levelDiv);
            container.appendChild(genDiv);
        });
    },

    // جدول أفراد العائلة وإرسال الدعوات
    renderAdminMembersTable(members) {
        const tbody = document.getElementById('adminMembersTableBody');
        tbody.innerHTML = '';

        members.forEach(m => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-slate-50 transition';

            let statusBadge = m.isAlive === false 
                ? '<span class="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">متوفى</span>'
                : (m.status === 'invited' 
                    ? '<span class="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">بانتظار قبول الدعوة</span>'
                    : '<span class="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">نشط ومسجل</span>');

            tr.innerHTML = `
                <td class="py-2.5 px-4 font-bold text-slate-800">
                    <div class="flex items-center gap-2">
                        <i class="fa-solid ${m.gender === 'female' ? 'fa-female text-rose-500' : 'fa-male text-emerald-600'} text-sm"></i>
                        <span>${m.name}</span>
                    </div>
                </td>
                <td class="py-2.5 px-4 text-slate-600 font-semibold">الجيل ${m.generation || 2} - ${m.title || 'عضو'}</td>
                <td class="py-2.5 px-4 font-mono text-slate-700">${m.phone || '<span class="text-slate-300">-</span>'}</td>
                <td class="py-2.5 px-4 text-slate-500">${m.city || 'الرياض'} / ${m.job || 'لا يوجد'}</td>
                <td class="py-2.5 px-4">${statusBadge}</td>
                <td class="py-2.5 px-4 text-center">
                    <div class="flex items-center justify-center gap-1.5">
                        ${m.phone ? `
                            <button onclick="App.openInviteForMember('${m.id}')" class="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-sm">
                                <i class="fa-brands fa-whatsapp"></i>
                                <span>دعوة واتساب</span>
                            </button>
                            <button onclick="App.testMemberLoginDirect('${m.phone}')" class="bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-1 rounded-lg font-bold text-[11px] border border-blue-200" title="محاكاة دخول هذا العضو برقم جواله">
                                <i class="fa-solid fa-arrow-right-to-bracket"></i>
                            </button>
                        ` : `
                            <span class="text-[10px] text-slate-400">بدون هاتف مسجل</span>
                        `}
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    // مركز الاعتماد والموافقات للأدمن
    renderAdminApprovals(familyId) {
        const pendingNews = this.state.data.news.filter(n => n.familyId === familyId && n.status === 'pending');
        const pendingDocs = this.state.data.documents.filter(d => d.familyId === familyId && d.status === 'pending');

        const newsContainer = document.getElementById('adminPendingNewsList');
        newsContainer.innerHTML = '';
        if (pendingNews.length === 0) {
            newsContainer.innerHTML = `
                <div class="p-6 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-400 text-xs">
                    <i class="fa-solid fa-circle-check text-2xl text-emerald-500 mb-2"></i>
                    <p>لا توجد أي أخبار أو مناسبات معلقة حالياً</p>
                </div>
            `;
        } else {
            pendingNews.forEach(n => {
                const card = document.createElement('div');
                card.className = 'bg-white rounded-xl border border-amber-200 p-4 shadow-sm space-y-3';
                card.innerHTML = `
                    <div class="flex items-start justify-between gap-2">
                        <div>
                            <span class="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">${n.category || 'خبر عائلي'}</span>
                            <h5 class="font-black text-slate-800 text-sm mt-1">${n.title}</h5>
                            <p class="text-[11px] text-slate-500 mt-0.5">
                                الكاتب: <span class="font-bold text-slate-700">${n.authorName}</span> (${n.authorRole || 'عضو'}) | ${n.createdAt || 'اليوم'}
                            </p>
                        </div>
                    </div>
                    <p class="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">${n.content}</p>
                    <div class="flex items-center gap-2 pt-1">
                        <button onclick="App.approveNews('${n.id}')" class="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-1.5 rounded-lg transition flex items-center justify-center gap-1 shadow-sm">
                            <i class="fa-solid fa-check"></i>
                            <span>اعتماد ونشر في ساحة العائلة</span>
                        </button>
                        <button onclick="App.rejectNews('${n.id}')" class="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs px-3 py-1.5 rounded-lg border border-rose-200 transition">
                            رفض
                        </button>
                    </div>
                `;
                newsContainer.appendChild(card);
            });
        }

        const docsContainer = document.getElementById('adminPendingDocsList');
        docsContainer.innerHTML = '';
        if (pendingDocs.length === 0) {
            docsContainer.innerHTML = `
                <div class="p-6 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-400 text-xs">
                    <i class="fa-solid fa-circle-check text-2xl text-emerald-500 mb-2"></i>
                    <p>لا توجد أي وثائق تاريخية معلقة للمراجعة</p>
                </div>
            `;
        } else {
            pendingDocs.forEach(d => {
                const card = document.createElement('div');
                card.className = 'bg-white rounded-xl border border-blue-200 p-4 shadow-sm space-y-3';
                card.innerHTML = `
                    <div class="flex items-start gap-3">
                        <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl flex-shrink-0">
                            <i class="fa-solid ${d.icon || 'fa-file-shield'}"></i>
                        </div>
                        <div class="flex-1">
                            <span class="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded">${d.category || 'وثيقة قديمة'}</span>
                            <h5 class="font-black text-slate-800 text-sm mt-1">${d.title}</h5>
                            <p class="text-[11px] text-slate-500 mt-0.5">
                                المرفق بواسطة: <span class="font-bold text-slate-700">${d.authorName}</span> | حجم الملف: ${d.size || '4 MB'}
                            </p>
                        </div>
                    </div>
                    <p class="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">${d.description || 'وثيقة تاريخية خاصة بالأسرة.'}</p>
                    <div class="flex items-center gap-2 pt-1">
                        <button onclick="App.approveDoc('${d.id}')" class="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-1.5 rounded-lg transition flex items-center justify-center gap-1 shadow-sm">
                            <i class="fa-solid fa-check-double"></i>
                            <span>اعتماد وأرشفة في سجل العائلة</span>
                        </button>
                        <button onclick="App.rejectDoc('${d.id}')" class="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs px-3 py-1.5 rounded-lg border border-rose-200 transition">
                            رفض
                        </button>
                    </div>
                `;
                docsContainer.appendChild(card);
            });
        }
    },

    // اعتماد ونشر خبر
    approveNews(newsId) {
        const item = this.state.data.news.find(n => n.id === newsId);
        if (!item) return;
        item.status = 'approved';
        this.logActivity(item.familyId, this.getActiveFamily().admin.name, `اعتمد الأدمن نشر خبر: "${item.title}"`, 'news', 'fa-check-double', 'emerald');
        this.saveState();
        this.renderAdminView();
        this.showToast('تم اعتماد الخبر ونشره في ساحة العائلة بنجاح!', 'success');
    },

    rejectNews(newsId) {
        this.state.data.news = this.state.data.news.filter(n => n.id !== newsId);
        this.saveState();
        this.renderAdminView();
        this.showToast('تم رفض وحذف الخبر المعلق', 'info');
    },

    // اعتماد وأرشفة وثيقة
    approveDoc(docId) {
        const item = this.state.data.documents.find(d => d.id === docId);
        if (!item) return;
        item.status = 'approved';
        this.logActivity(item.familyId, this.getActiveFamily().admin.name, `اعتمد الأدمن الوثيقة التاريخية: "${item.title}"`, 'doc', 'fa-box-archive', 'blue');
        this.saveState();
        this.renderAdminView();
        this.showToast('تم اعتماد الوثيقة وإضافتها لأرشيف العائلة الدائم!', 'success');
    },

    rejectDoc(docId) {
        this.state.data.documents = this.state.data.documents.filter(d => d.id !== docId);
        this.saveState();
        this.renderAdminView();
        this.showToast('تم رفض الوثيقة المعلقة', 'info');
    },

    // ساحة العائلة المعتمدة
    renderAdminFeed(familyId) {
        const approvedNews = this.state.data.news.filter(n => n.familyId === familyId && n.status === 'approved');
        const approvedDocs = this.state.data.documents.filter(d => d.familyId === familyId && d.status === 'approved');

        const newsBox = document.getElementById('approvedNewsFeedList');
        newsBox.innerHTML = '';
        if (approvedNews.length === 0) {
            newsBox.innerHTML = '<p class="text-xs text-slate-400 p-4 bg-slate-50 rounded-xl">لا توجد أخبار منشورة بعد</p>';
        } else {
            approvedNews.forEach(n => {
                const div = document.createElement('div');
                div.className = 'bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2';
                div.innerHTML = `
                    <div class="flex items-center justify-between">
                        <span class="bg-emerald-50 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded border border-emerald-200">${n.category || 'خبر عائلي'}</span>
                        <span class="text-[10px] text-slate-400">${n.date || n.createdAt}</span>
                    </div>
                    <h5 class="font-bold text-slate-800 text-xs">${n.title}</h5>
                    <p class="text-xs text-slate-600 leading-relaxed">${n.content}</p>
                    <div class="text-[10px] text-slate-400 pt-1 border-t border-slate-100 flex items-center justify-between">
                        <span>الكاتب: ${n.authorName}</span>
                        <span class="text-emerald-600 font-bold"><i class="fa-solid fa-circle-check"></i> منشور ومعتمد</span>
                    </div>
                `;
                newsBox.appendChild(div);
            });
        }

        const docsBox = document.getElementById('approvedDocsFeedList');
        docsBox.innerHTML = '';
        if (approvedDocs.length === 0) {
            docsBox.innerHTML = '<p class="text-xs text-slate-400 p-4 bg-slate-50 rounded-xl">لا توجد وثائق معتمدة بعد</p>';
        } else {
            approvedDocs.forEach(d => {
                const div = document.createElement('div');
                div.className = 'bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2';
                div.innerHTML = `
                    <div class="flex items-center justify-between">
                        <span class="bg-blue-50 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded border border-blue-200">${d.category}</span>
                        <span class="text-[10px] text-slate-400">${d.date}</span>
                    </div>
                    <div class="flex items-start gap-2.5">
                        <div class="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-sm flex-shrink-0">
                            <i class="fa-solid ${d.icon || 'fa-file-shield'}"></i>
                        </div>
                        <div>
                            <h5 class="font-bold text-slate-800 text-xs">${d.title}</h5>
                            <p class="text-xs text-slate-600 mt-1">${d.description}</p>
                        </div>
                    </div>
                    <div class="text-[10px] text-slate-400 pt-1 border-t border-slate-100 flex items-center justify-between">
                        <span>أضيف بواسطة: ${d.authorName}</span>
                        <span class="text-blue-600 font-bold"><i class="fa-solid fa-lock"></i> مؤرشف ومحمي</span>
                    </div>
                `;
                docsBox.appendChild(div);
            });
        }
    },

    // سجل العمليات الحيوية للأدمن
    renderAdminLogs(familyId) {
        const logsContainer = document.getElementById('adminActivityLogsList');
        logsContainer.innerHTML = '';
        const logs = (this.state.data.activities || []).filter(a => a.familyId === familyId);

        if (logs.length === 0) {
            logsContainer.innerHTML = '<p class="text-xs text-slate-400 p-4 text-center">لا توجد أي أنشطة مسجلة بعد</p>';
            return;
        }

        logs.forEach(log => {
            const row = document.createElement('div');
            row.className = 'py-3 flex items-start gap-3';
            row.innerHTML = `
                <div class="w-8 h-8 rounded-lg bg-${log.color || 'slate'}-100 text-${log.color || 'slate'}-700 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                    <i class="fa-solid ${log.icon || 'fa-bell'}"></i>
                </div>
                <div class="flex-1 text-xs">
                    <div class="flex items-center justify-between">
                        <span class="font-black text-slate-800">${log.userName}</span>
                        <span class="text-[10px] text-slate-400">${log.time}</span>
                    </div>
                    <p class="text-slate-600 mt-0.5">${log.action}</p>
                </div>
            `;
            logsContainer.appendChild(row);
        });
    },

    // تسجيل نشاط حيوي جديد
    logActivity(familyId, userName, action, category, icon, color) {
        if (!this.state.data.activities) this.state.data.activities = [];
        this.state.data.activities.unshift({
            id: 'act-' + Date.now(),
            familyId,
            userName,
            action,
            category,
            time: 'الآن',
            icon: icon || 'fa-bell',
            color: color || 'emerald'
        });
    },

    // فتح مودال إضافة فرد للمشجرة
    openAddMemberModal() {
        const family = this.getActiveFamily();
        const members = this.state.data.members.filter(m => m.familyId === family.id && m.gender === 'male');
        const select = document.getElementById('newMemberParent');
        select.innerHTML = '';

        members.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.id;
            opt.textContent = `${m.name} (${m.title || 'أب/فرع'})`;
            select.appendChild(opt);
        });

        document.getElementById('modalAddMember').classList.remove('hidden');
    },

    openAddMemberUnder(parentId) {
        this.openAddMemberModal();
        const select = document.getElementById('newMemberParent');
        if (select) select.value = parentId;
    },

    // تنفيذ إضافة فرد جديد للمشجرة
    handleAddMember(event) {
        event.preventDefault();
        const family = this.getActiveFamily();
        const name = document.getElementById('newMemberName').value.trim();
        const gender = document.getElementById('newMemberGender').value;
        const gen = parseInt(document.getElementById('newMemberGen').value, 10);
        const parentId = document.getElementById('newMemberParent').value;
        const phone = document.getElementById('newMemberPhone').value.trim();
        const city = document.getElementById('newMemberCity').value.trim() || 'الرياض';
        const job = document.getElementById('newMemberJob').value.trim() || 'عضو بالعائلة';

        const newId = 'm-' + Date.now();
        const newMember = {
            id: newId,
            familyId: family.id,
            name,
            title: gen === 2 ? 'ابن' : (gen === 3 ? 'حفيد' : 'شبل'),
            gender,
            generation: gen,
            parentId,
            phone,
            status: phone ? 'invited' : 'active',
            isAlive: true,
            city,
            job,
            bio: 'تمت إضافته في شجرة العائلة حديثاً.'
        };

        this.state.data.members.push(newMember);

        // تسجيل النشاط وتحديث الساس
        this.logActivity(family.id, family.admin.name, `أضاف عضواً جديداً في المشجرة: "${name}" برقم جوال ${phone}`, 'tree', 'fa-user-plus', 'emerald');
        this.saveState();

        this.closeModal('modalAddMember');
        this.renderAdminView();
        this.showToast(`تمت إضافة ${name} إلى الشجرة بنجاح! تم تحديث باقة الساس.`, 'success');

        // اقتراح إرسال دعوة واتساب فوراً
        if (phone) {
            setTimeout(() => {
                this.openInviteForMember(newId);
            }, 500);
        }
    },

    // مودال إرسال دعوة واتساب
    openWhatsAppInviteModal() {
        const family = this.getActiveFamily();
        const members = this.state.data.members.filter(m => m.familyId === family.id && m.phone);
        const select = document.getElementById('inviteMemberSelect');
        select.innerHTML = '';

        members.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.id;
            opt.textContent = `${m.name} - ${m.phone} (${m.status === 'invited' ? 'بانتظار التفعيل' : 'نشط'})`;
            select.appendChild(opt);
        });

        const baseUrlInput = document.getElementById('inviteBaseUrlInput');
        if (baseUrlInput) {
            baseUrlInput.value = this.getBaseUrl();
        }

        this.updateInvitePreview();
        document.getElementById('modalWhatsAppInvite').classList.remove('hidden');
    },

    openInviteForMember(memberId) {
        this.openWhatsAppInviteModal();
        const select = document.getElementById('inviteMemberSelect');
        if (select) {
            select.value = memberId;
            this.updateInvitePreview();
        }
    },

    updateInvitePreview() {
        const select = document.getElementById('inviteMemberSelect');
        if (!select || !select.value) return;
        const member = this.state.data.members.find(m => m.id === select.value);
        const family = this.getActiveFamily();
        if (!member) return;

        const baseUrl = this.getBaseUrl();
        const inviteUrl = `${baseUrl}?fam=${family.id}&phone=${encodeURIComponent(member.phone)}&role=member`;

        const previewBox = document.getElementById('whatsappMessagePreview');
        const text = `السلام عليكم ورحمة الله وبركاته يا ${member.gender === 'female' ? 'ابنة العم' : 'ابن العم'} ${member.name}،

يسعدنا دعوتكم للانضمام وتفعيل حسابكم في البوابة والمشجرة الإلكترونية لـ (${family.name}) 🌳

📲 للدخول وتفعيل حسابك عبر الرابط المباشر:
${inviteUrl}

*رقم جوالك المعتمد للدخول:* ${member.phone}
(سيصلك رمز تحقق فوري OTP لتأكيد الهوية والدخول للبوابة).

ننتظر مشاركتك وتحديث بياناتك في سجل العائلة!`;

        previewBox.textContent = text;
        this.currentInviteMember = member;
        this.currentInviteText = text;
    },

    openWhatsAppWebDirect() {
        if (!this.currentInviteMember || !this.currentInviteMember.phone) {
            this.showToast('الرجاء اختيار فرد يمتلك رقم هاتف', 'warning');
            return;
        }
        let phone = this.currentInviteMember.phone.replace(/[^0-9]/g, '');
        if (phone.startsWith('05')) {
            phone = '966' + phone.substring(1);
        }
        const url = `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(this.currentInviteText)}`;
        window.open(url, '_blank');

        // تسجيل إرسال الدعوة
        const family = this.getActiveFamily();
        this.logActivity(family.id, family.admin.name, `تم إرسال دعوة انضمام عبر واتساب ويب للعضو: ${this.currentInviteMember.name}`, 'invite', 'fa-paper-plane', 'emerald');
        this.saveState();
        this.renderAdminView();
        this.showToast('تم فتح واتساب ويب وتجهيز رسالة الدعوة بنجاح!', 'success');
        this.closeModal('modalWhatsAppInvite');
    },

    // تجربة دخول العضو مباشرة من شاشة الدعوات
    testMemberLoginDirect(phoneNumber) {
        const phone = phoneNumber || (this.currentInviteMember && this.currentInviteMember.phone);
        if (!phone) return;
        this.closeModal('modalWhatsAppInvite');
        this.switchRole('member');
        this.quickFillMember(phone);
        this.showToast(`تم الانتقال لبوابة الفرد مع رقم: ${phone}`, 'info');
    },

    updateAdminBadge() {
        if (!this.state.data) return;
        const family = this.getActiveFamily();
        const pendingNews = this.state.data.news.filter(n => n.familyId === family.id && n.status === 'pending').length;
        const pendingDocs = this.state.data.documents.filter(d => d.familyId === family.id && d.status === 'pending').length;
        const total = pendingNews + pendingDocs;

        const badge = document.getElementById('adminPendingBadge');
        if (badge) {
            if (total > 0) {
                badge.textContent = total;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }
    },

    // ==========================================
    // سيناريو 3: بوابة فرد العائلة (Member Portal & OTP)
    // ==========================================
    renderMemberView() {
        if (this.state.currentMember) {
            document.getElementById('memberLoginStep').classList.add('hidden');
            document.getElementById('memberDashboardStep').classList.remove('hidden');
            this.renderMemberDashboard();
        } else {
            document.getElementById('memberLoginStep').classList.remove('hidden');
            document.getElementById('memberDashboardStep').classList.add('hidden');
            document.getElementById('otpSimulationSection').classList.add('hidden');

            // إذا كان هناك رقم قادم من الرابط يتم تعبئته فوراً
            const urlParams = new URLSearchParams(window.location.search);
            const phoneParam = urlParams.get('phone');
            if (phoneParam) {
                const phoneInput = document.getElementById('memberPhoneInput');
                if (phoneInput && !phoneInput.value) {
                    phoneInput.value = phoneParam;
                }
            }
        }
    },

    quickFillMember(phone) {
        const input = document.getElementById('memberPhoneInput');
        if (input) {
            input.value = phone;
            this.showToast(`تمت تعبئة رقم الجوال: ${phone}`, 'info');
        }
    },

    // محاكاة إرسال OTP
    handleSendOtp(event) {
        event.preventDefault();
        const phone = document.getElementById('memberPhoneInput').value.trim();
        const family = this.getActiveFamily();

        // التحقق من أن الرقم مسجل ومطابق لما أدخله الأدمن
        const member = this.state.data.members.find(m => m.familyId === family.id && m.phone === phone);
        if (!member) {
            this.showToast('عذراً، هذا الرقم غير مسجل في شجرة العائلة! تأكد من أن الأدمن قام بإضافتك وإرسال الدعوة.', 'error');
            return;
        }

        // توليد رمز OTP تجريبي عشوائي مكون من 4 أرقام
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        this.state.generatedOtp = otp;
        this.tempVerifyingMember = member;

        // إظهار قسم محاكاة OTP للعميل في Phase 1
        const otpSec = document.getElementById('otpSimulationSection');
        otpSec.classList.remove('hidden');
        document.getElementById('generatedOtpDisplay').textContent = otp;

        this.showToast(`تم توليد رمز التحقق التجريبي: ${otp}`, 'info');
    },

    autoFillOtp() {
        if (this.state.generatedOtp) {
            document.getElementById('memberOtpInput').value = this.state.generatedOtp;
            this.handleVerifyOtp(new Event('submit'));
        }
    },

    handleVerifyOtp(event) {
        if (event && event.preventDefault) event.preventDefault();
        const enteredOtp = document.getElementById('memberOtpInput').value.trim();

        if (enteredOtp !== this.state.generatedOtp) {
            this.showToast('رمز التحقق غير صحيح! يرجى إدخال الرمز التجريبي الظاهر أعلاه.', 'error');
            return;
        }

        // تسجيل الدخول بنجاح
        const member = this.tempVerifyingMember;
        member.status = 'active'; // أصبح مفعلاً
        this.state.currentMember = member;

        // تسجيل النشاط الحيوي
        const family = this.getActiveFamily();
        this.logActivity(family.id, member.name, `سجل العضو دخوله للبوابة بنجاح عبر التحقق برقم جواله ${member.phone}`, 'auth', 'fa-right-to-bracket', 'emerald');
        this.saveState();

        this.showToast(`أهلاً بك يا ${member.name} في بوابة العائلة!`, 'success');
        this.renderMemberView();
    },

    logoutMember() {
        this.state.currentMember = null;
        this.state.generatedOtp = null;
        this.renderMemberView();
        this.showToast('تم تسجيل الخروج من بوابة الفرد', 'info');
    },

    // عرض لوحة الفرد بعد الدخول
    renderMemberDashboard() {
        const member = this.state.currentMember;
        if (!member) return;

        // الترويسة
        document.getElementById('currentMemberNameDisplay').textContent = member.name;
        document.getElementById('currentMemberDetailsDisplay').textContent = `الجيل ${member.generation || 3} | ${member.city || 'الرياض'} | ${member.job || 'عضو'}`;

        // بيانات الملف الشخصي
        document.getElementById('profName').textContent = member.name;
        document.getElementById('profPhone').textContent = member.phone || '-';
        document.getElementById('profCity').textContent = member.city || 'الرياض';
        document.getElementById('profJob').textContent = member.job || 'عضو بالعائلة';
        document.getElementById('profBio').textContent = member.bio || 'لا توجد نبذة مسجلة.';

        // تعبئة حقول التعديل
        document.getElementById('editNameInput').value = member.name;
        document.getElementById('editCityInput').value = member.city || '';
        document.getElementById('editJobInput').value = member.job || '';
        document.getElementById('editBioInput').value = member.bio || '';

        // عرض الأبناء والذرية التابعين لهذا العضو
        this.renderMemberChildren(member.id);

        // متابعة طلبات ومنشورات هذا العضو
        this.renderMemberSubmissions(member);

        // ساحة الأخبار المعتمدة
        this.renderMemberApprovedFeed(member.familyId);
    },

    toggleEditProfile() {
        const viewBox = document.getElementById('profileViewBox');
        const form = document.getElementById('profileEditForm');
        const btn = document.getElementById('editProfileToggleBtn');

        if (form.classList.contains('hidden')) {
            form.classList.remove('hidden');
            viewBox.classList.add('hidden');
            btn.textContent = 'إلغاء التعديل';
        } else {
            form.classList.add('hidden');
            viewBox.classList.remove('hidden');
            btn.textContent = 'تعديل';
        }
    },

    handleSaveProfile(event) {
        event.preventDefault();
        const member = this.state.currentMember;
        member.name = document.getElementById('editNameInput').value.trim();
        member.city = document.getElementById('editCityInput').value.trim();
        member.job = document.getElementById('editJobInput').value.trim();
        member.bio = document.getElementById('editBioInput').value.trim();

        // تحديثه في مصفوفة الأعضاء
        const idx = this.state.data.members.findIndex(m => m.id === member.id);
        if (idx !== -1) {
            this.state.data.members[idx] = member;
        }

        this.logActivity(member.familyId, member.name, `حدّث بيانات ملفه الشخصي والإقامة`, 'auth', 'fa-user-pen', 'blue');
        this.saveState();
        this.toggleEditProfile();
        this.renderMemberDashboard();
        this.showToast('تم حفظ وتحديث بياناتك الشخصية بنجاح!', 'success');
    },

    renderMemberChildren(memberId) {
        const children = this.state.data.members.filter(m => m.parentId === memberId);
        const container = document.getElementById('memberChildrenList');
        container.innerHTML = '';

        if (children.length === 0) {
            container.innerHTML = `
                <div class="p-3 text-center bg-slate-50 rounded-lg text-slate-400">
                    <p>لم تقم بإضافة أبناء أو تابعين تحت اسمك بعد.</p>
                </div>
            `;
            return;
        }

        children.forEach(c => {
            const row = document.createElement('div');
            row.className = 'p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between';
            row.innerHTML = `
                <div class="flex items-center gap-2">
                    <i class="fa-solid ${c.gender === 'female' ? 'fa-child-dress text-rose-500' : 'fa-child text-emerald-600'}"></i>
                    <div>
                        <span class="font-bold text-slate-800 block text-xs">${c.name}</span>
                        <span class="text-[10px] text-slate-400">${c.bio || c.city || 'الجيل الرابع'}</span>
                    </div>
                </div>
                <span class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">في المشجرة</span>
            `;
            container.appendChild(row);
        });
    },

    // فتح مودال إضافة ابن/فرد تحت هذا العضو
    openAddChildModal() {
        document.getElementById('modalAddChild').classList.remove('hidden');
    },

    handleAddChildSubmit(event) {
        event.preventDefault();
        const member = this.state.currentMember;
        const name = document.getElementById('newChildName').value.trim();
        const gender = document.getElementById('newChildGender').value;
        const city = document.getElementById('newChildCity').value.trim() || member.city || 'الرياض';
        const phone = document.getElementById('newChildPhone').value.trim();
        const bio = document.getElementById('newChildBio').value.trim() || 'ابن مضاف حديثاً في المشجرة';

        const newChild = {
            id: 'm-' + Date.now(),
            familyId: member.familyId,
            name,
            title: gender === 'female' ? 'ابنة' : 'ابن',
            gender,
            generation: (member.generation || 3) + 1,
            parentId: member.id,
            phone,
            status: phone ? 'invited' : 'active',
            isAlive: true,
            city,
            job: 'طالب/طفل',
            bio
        };

        this.state.data.members.push(newChild);

        // تسجيل العملية في السجل الحيوي
        this.logActivity(member.familyId, member.name, `أضاف ابنه "${name}" في شجرة العائلة (تحديث تلقائي لعدد المشتركين)`, 'tree', 'fa-child-reaching', 'purple');
        this.saveState();

        this.closeModal('modalAddChild');
        this.renderMemberDashboard();
        this.showToast(`تمت إضافة ${name} لشجرة العائلة بنجاح! تم احتسابه ضمن باقة الساس.`, 'success');
    },

    // متابعة منشورات العضو وحالتها
    renderMemberSubmissions(member) {
        const myNews = this.state.data.news.filter(n => n.familyId === member.familyId && (n.authorPhone === member.phone || n.authorName === member.name));
        const myDocs = this.state.data.documents.filter(d => d.familyId === member.familyId && (d.authorPhone === member.phone || d.authorName === member.name));
        const container = document.getElementById('memberSubmissionsList');
        container.innerHTML = '';

        if (myNews.length === 0 && myDocs.length === 0) {
            container.innerHTML = `
                <div class="p-4 bg-slate-50 text-center rounded-xl text-slate-400 text-xs">
                    لم تقم بإرسال أي أخبار أو وثائق للمراجعة بعد. يمكنك نشر خبر جديد أو رفع وثيقة من الأزرار أعلاه.
                </div>
            `;
            return;
        }

        myNews.forEach(n => {
            const div = document.createElement('div');
            div.className = 'p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs';
            const statusBadge = n.status === 'approved' 
                ? '<span class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full"><i class="fa-solid fa-circle-check"></i> تم الاعتماد والنشر</span>'
                : '<span class="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-1 rounded-full"><i class="fa-solid fa-clock"></i> ⏳ بانتظار موافقة أدمن العائلة</span>';

            div.innerHTML = `
                <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-lg bg-gold-100 text-gold-700 flex items-center justify-center text-sm">
                        <i class="fa-solid fa-bullhorn"></i>
                    </div>
                    <div>
                        <span class="font-bold text-slate-800 block">${n.title}</span>
                        <span class="text-[10px] text-slate-400">${n.category} | ${n.date || 'اليوم'}</span>
                    </div>
                </div>
                ${statusBadge}
            `;
            container.appendChild(div);
        });

        myDocs.forEach(d => {
            const div = document.createElement('div');
            div.className = 'p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs';
            const statusBadge = d.status === 'approved' 
                ? '<span class="bg-blue-100 text-blue-800 text-[10px] font-bold px-2.5 py-1 rounded-full"><i class="fa-solid fa-circle-check"></i> معتمدة ومؤرشفة</span>'
                : '<span class="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-1 rounded-full"><i class="fa-solid fa-clock"></i> ⏳ بانتظار موافقة أدمن العائلة</span>';

            div.innerHTML = `
                <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-sm">
                        <i class="fa-solid fa-file-shield"></i>
                    </div>
                    <div>
                        <span class="font-bold text-slate-800 block">${d.title}</span>
                        <span class="text-[10px] text-slate-400">${d.category} | وثيقة</span>
                    </div>
                </div>
                ${statusBadge}
            `;
            container.appendChild(div);
        });
    },

    // ساحة أخبار العائلة للعضو
    renderMemberApprovedFeed(familyId) {
        const approvedNews = this.state.data.news.filter(n => n.familyId === familyId && n.status === 'approved');
        const container = document.getElementById('memberApprovedFeedList');
        container.innerHTML = '';

        if (approvedNews.length === 0) {
            container.innerHTML = '<p class="text-xs text-slate-400 p-4 bg-slate-50 rounded-xl">لا توجد أخبار منشورة حالياً</p>';
            return;
        }

        approvedNews.forEach(n => {
            const card = document.createElement('div');
            card.className = 'p-4 rounded-xl border border-slate-200 bg-white space-y-2';
            card.innerHTML = `
                <div class="flex items-center justify-between">
                    <span class="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded">${n.category}</span>
                    <span class="text-[10px] text-slate-400 font-mono">${n.date}</span>
                </div>
                <h4 class="font-black text-slate-800 text-sm">${n.title}</h4>
                <p class="text-xs text-slate-600 leading-relaxed">${n.content}</p>
                <div class="text-[10px] text-slate-400 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span>الكاتب: ${n.authorName}</span>
                    <span class="text-emerald-600 font-bold"><i class="fa-solid fa-shield-check"></i> معتمد من مجلس العائلة</span>
                </div>
            `;
            container.appendChild(card);
        });
    },

    // تقديم خبر من قبل العضو
    openCreateNewsModal() {
        document.getElementById('modalCreateNews').classList.remove('hidden');
    },

    handleCreateNewsSubmit(event) {
        event.preventDefault();
        const member = this.state.currentMember;
        const title = document.getElementById('newNewsTitle').value.trim();
        const category = document.getElementById('newNewsCategory').value;
        const date = document.getElementById('newNewsDate').value;
        const content = document.getElementById('newNewsContent').value.trim();

        const newNewsItem = {
            id: 'n-' + Date.now(),
            familyId: member.familyId,
            title,
            category,
            authorName: member.name,
            authorPhone: member.phone,
            authorRole: 'فرد من العائلة',
            date,
            content,
            status: 'pending', // معلق بانتظار موافقة الأدمن
            createdAt: 'الآن'
        };

        this.state.data.news.unshift(newNewsItem);

        // تسجيل النشاط الحيوي
        this.logActivity(member.familyId, member.name, `قدم خبراً جديداً بانتظار اعتماد الأدمن: "${title}"`, 'news', 'fa-bullhorn', 'amber');
        this.saveState();

        this.closeModal('modalCreateNews');
        this.renderMemberDashboard();
        this.updateAdminBadge();
        this.showToast('تم إرسال الخبر بنجاح! سيظهر في ساحة العائلة بعد موافقة الأدمن.', 'success');
    },

    // رفع وثيقة من قبل العضو
    openUploadDocModal() {
        document.getElementById('modalUploadDoc').classList.remove('hidden');
    },

    handleUploadDocSubmit(event) {
        event.preventDefault();
        const member = this.state.currentMember;
        const title = document.getElementById('newDocTitle').value.trim();
        const category = document.getElementById('newDocCategory').value;
        const description = document.getElementById('newDocDescription').value.trim();

        const newDocItem = {
            id: 'd-' + Date.now(),
            familyId: member.familyId,
            title,
            category,
            authorName: member.name,
            authorPhone: member.phone,
            authorRole: 'فرد من العائلة',
            fileType: 'image',
            icon: 'fa-file-shield',
            size: '4.2 MB',
            date: new Date().toISOString().split('T')[0],
            status: 'pending', // معلق بانتظار موافقة الأدمن
            description
        };

        this.state.data.documents.unshift(newDocItem);

        // تسجيل النشاط الحيوي
        this.logActivity(member.familyId, member.name, `رفع وثيقة تاريخية بانتظار تدقيق الأدمن: "${title}"`, 'doc', 'fa-file-arrow-up', 'blue');
        this.saveState();

        this.closeModal('modalUploadDoc');
        this.renderMemberDashboard();
        this.updateAdminBadge();
        this.showToast('تم رفع الوثيقة بنجاح! سيتم تدقيقها وأرشفتها بواسطة الأدمن.', 'success');
    },

    // ==========================================
    // نوافذ منبثقة وإشعارات (Modals & Alerts)
    // ==========================================
    closeModal(modalId) {
        const m = document.getElementById(modalId);
        if (m) m.classList.add('hidden');
    },

    showDemoGuide() {
        document.getElementById('modalDemoGuide').classList.remove('hidden');
    },

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        const bgColors = {
            success: 'bg-emerald-900 border-emerald-500 text-emerald-100',
            info: 'bg-slate-900 border-slate-600 text-slate-100',
            warning: 'bg-amber-900 border-amber-500 text-amber-100',
            error: 'bg-rose-900 border-rose-500 text-rose-100'
        };

        const icons = {
            success: 'fa-check-circle text-emerald-400',
            info: 'fa-info-circle text-blue-400',
            warning: 'fa-triangle-exclamation text-amber-400',
            error: 'fa-circle-xmark text-rose-400'
        };

        toast.className = `${bgColors[type] || bgColors.info} border px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs view-fade transform transition-all duration-300`;
        toast.innerHTML = `
            <i class="fa-solid ${icons[type] || icons.info} text-base flex-shrink-0"></i>
            <span class="flex-1 font-semibold leading-relaxed">${message}</span>
        `;

        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }
};

// تشغيل التطبيق عند تحميل المستند
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
