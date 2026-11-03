'use strict';
/* =========================================================
   测试项目管理看板 v3 — 单文件应用（数据存 localStorage）
   专业测试流程：准入 → 执行 → 门禁 → 准出，含缺陷/轮次/追溯矩阵
   ========================================================= */

const LS_KEY = 'testboard.v3';

/* ---------- 阶段骨架 ---------- */
const STAGES = [
{
  id:'pre', no:'S1', name:'公共前置', badge:'所有测试类型', tone:'#6366f1', icon:'①',
  role:'测试负责人 + 项目经理',
  goal:'把所有测试类型共用的准备动作做扎实：锁定需求基线、对齐测试范围、确认指标可测、初评周期。',
  entry:['项目已立项，需求文档 / 规格书内部版本可获取','项目经理已指定测试负责人与测试团队'],
  groups:[{name:'准备动作', items:[
    ['需求','明确项目需求与规格书版本'],
    ['沟通','与项目经理沟通：测试指标/测试项/测试功能/测试需求/测试周期'],
    ['指标','指标拆解与可测性确认'],
    ['计划','测试周期初评']
  ]}],
  gates:[
    '需求与规格书版本已书面确认（记录版本号）',
    '测试指标/测试项/测试功能/测试需求/周期已与项目经理对齐',
    '每条指标均有明确的测试方法与判定标准',
    '测试周期初评结果已同步项目组'
  ],
  exit:'范围清晰、指标可测，可进入方案编制'
},
{
  id:'plan', no:'S2', name:'测试方案与评审门禁', badge:'🚦 硬门禁', tone:'#2f5cf6', icon:'②', gate:'🚦',
  role:'测试负责人（评审由项目组 + 需方代表参与）',
  goal:'产出方案、台账、记录模板与追溯矩阵；评审通过后周期基线化——这是项目的第一个硬门禁。',
  entry:['公共前置完成：需求基线、指标清单、周期初评已确认'],
  groups:[{name:'门禁交付物', items:[
    ['方案','测试方案 / 测试计划'],
    ['台账','测试项台账'],
    ['模板','测试记录表模板 📄'],
    ['追溯','指标-测试项-结果追溯矩阵'],
    ['基线','评审通过后周期基线化']
  ]}],
  gates:[
    '测试方案与计划通过评审（附评审记录/结论）',
    '测试项台账完整，含准入与准出标准',
    '测试记录表模板已下发到每一位执行人',
    '指标-测试项-结果追溯矩阵覆盖全部指标',
    '周期基线已锁定并对项目组发布'
  ],
  exit:'评审通过、周期基线化，可启动环境准备'
},
{
  id:'env', no:'S3', name:'环境与版本准备', badge:'就绪确认', tone:'#0891b2', icon:'③',
  role:'测试负责人 + 实验室管理员',
  goal:'人、机、料、法、环到位，被测版本冻结，环境检查留痕。',
  entry:['测试方案评审通过，周期已基线化','测试项台账与记录表模板已下发'],
  groups:[{name:'资源与版本', items:[
    ['资源','样机、仪器、账号、场地'],
    ['版本','测试版本冻结'],
    ['检查','环境检查确认']
  ]}],
  gates:[
    '样机/仪器/账号/场地逐项到位并有签收记录',
    '被测版本已冻结，版本号与构建时间记录在案',
    '环境检查表确认无异常（含标定/校准有效期）',
    '测试人员已就位并熟悉方案与记录要求'
  ],
  exit:'环境就绪、版本冻结，可按已下发的任务类型启动对应测试任务'
},
{
  id:'rd', no:'S4', name:'研发测试', badge:'研发过程验证', tone:'#0f9d58', icon:'④', track:true, same:true,
  role:'测试工程师（研发协同）',
  goal:'面向研发过程的全面验证，暴露问题、推动修复，输出缺陷清单，不追求发布级证据链。',
  entry:['下发任务单判定的任务类型为「研发测试」——本项目才执行本任务','环境与版本准备就绪（资源到位、版本冻结、环境检查通过）后启动，不依赖其他任务类型'],
  groups:[
    {name:'内场测试', items:[
      ['版本','版本更新项'],['版本','版本新增项'],['版本','版本BUG修复项'],
      ['指标','灵敏度测试'],['指标','功率测试'],['环境','高低温测试']
    ]},
    {name:'外场测试', items:[
      ['指标','侦测性能测试'],['指标','通信干扰测试'],['指标','导航干扰测试'],
      ['指标','导航诱骗测试'],['指标','干通比测试']
    ]}
  ],
  gates:[
    '计划内测试项全部执行完成',
    '严重/致命缺陷已关闭，或已取得书面豁免',
    '缺陷清单已提交研发并确定修复计划'
  ],
  exit:'✅ 计划项完成，严重缺陷关闭或书面豁免'
},
{
  id:'iter', no:'S4', name:'版本迭代测试', badge:'发布前质量门', tone:'#d98012', icon:'④', track:true, same:true,
  role:'测试工程师（版本发布把关）',
  goal:'发布前质量门：按变更影响做回归，用最小成本守住不退化。',
  entry:['下发任务单判定的任务类型为「版本迭代测试」——本项目才执行本任务','环境与版本准备就绪后启动，以版本轮次为驱动，不依赖其他任务类型'],
  groups:[
    {name:'内场测试', items:[
      ['版本','版本更新项'],['版本','版本新增项'],['版本','版本BUG修复项'],
      ['回归','灵敏度回归'],['回归','功率回归'],['回归','高低温回归']
    ]},
    {name:'外场测试', items:[
      ['回归','核心指标按变更影响回归'],
      ['指标','侦测性能'],['指标','通信干扰'],['指标','导航干扰'],
      ['指标','导航诱骗'],['指标','干通比']
    ]}
  ],
  gates:[
    '冒烟测试通过（主干功能可用）',
    '回归范围完成（覆盖全部变更影响面）',
    '上一轮缺陷已验证关闭，无新增致命/严重缺陷',
    '发布准入条件满足'
  ],
  exit:'✅ 冒烟通过、回归完成、发布准入满足'
},
{
  id:'accept', no:'S4', name:'验收测试', badge:'交付前独立终验 🔒', tone:'#7c4dff', icon:'④', gate:'🔒', track:true, same:true,
  role:'测试负责人独立执行（项目组不得干预判定）',
  goal:'交付前独立终验：指标全覆盖、原始证据齐全、独立判定，项目组说辞不作为通过依据。',
  entry:['下发任务单判定的任务类型为「验收测试」——本项目才执行本任务','环境与版本准备就绪后启动，验收方案与指标清单已与需方确认'],
  groups:[
    {name:'内场测试', items:[
      ['指标','灵敏度测试'],['指标','功率测试'],['环境','高低温测试'],
      ['环境','防水测试'],['环境','振动测试'],['软件','软件平台测试'],['其他','其他测试项']
    ]},
    {name:'外场测试', items:[
      ['指标','侦测性能测试'],['指标','通信干扰测试'],['指标','导航干扰测试'],
      ['指标','导航诱骗测试'],['指标','干通比测试']
    ]},
    {name:'独立判定 🔒', items:[
      ['判定','指标全覆盖'],['判定','原始证据齐全'],
      ['判定','项目组说辞不作为通过依据'],['判定','测试负责人独立签署']
    ]}
  ],
  gates:[
    '每一项指标都有逐项结论（通过/不通过/有条件通过）',
    '原始证据齐全（原始数据、截图/录像、仪器记录）',
    '判定过程独立于项目组，结论由测试负责人签署',
    '偏差项已走书面审批，未审批项不得判定通过'
  ],
  exit:'✅ 逐项结论、证据齐全、偏差书面审批'
},
{
  id:'assist', no:'S4', name:'部门协助', badge:'支撑流程', tone:'#64748b', icon:'④', track:true, same:true,
  role:'直属领导协调（跨部门）',
  goal:'横向支撑：需求有出处、资源有确认、执行有记录、结果有归档。',
  entry:['由直属领导下发的任务类型包含「部门协助」时纳入本项目，需求有书面下发记录'],
  groups:[{name:'协助闭环', items:[
    ['发起','直属领导下发协助需求'],['明确','明确项目、地点、时间周期'],
    ['资源','资源到位确认'],['执行','协助执行记录'],['归档','结果反馈与归档']
  ]}],
  gates:[
    '协助需求有书面下发记录',
    '项目/地点/时间周期已明确',
    '资源到位并确认',
    '执行记录与结果反馈已归档'
  ],
  exit:'协助事项闭环并归档'
},
{
  id:'report', no:'S5', name:'报告与归档', badge:'项目收口', tone:'#334155', icon:'⑤',
  role:'测试负责人',
  goal:'用一份可追溯的报告收口：结论、缺陷、争议、证据全部闭环。',
  entry:['本项目已下发的任务类型（研发/迭代/验收/协助）全部准出','缺陷与变更已形成闭环清单'],
  groups:[{name:'收口交付物', items:[
    ['报告','测试报告 / 验收报告'],['闭环','缺陷与变更闭环'],
    ['复核','争议复核与偏差审批'],['归档','文档证据归档关闭']
  ]}],
  gates:[
    '测试/验收报告已签署发布',
    '缺陷与变更全部闭环（关闭或书面豁免）',
    '争议事项已复核并留有结论',
    '文档与原始证据归档完成，归档清单关闭'
  ],
  exit:'报告发布、归档关闭，项目完结'
}
];

/* 每阶段的「怎么干」操作步骤（SOP）与交付物——让执行人拿到就能上手 */
const STAGE_SOP = {
  pre: {short:'公共前置', steps:[
      '找项目经理拿齐项目需求书、规格书（确认版本号），记录在项目信息里',
      '与项目经理对齐四件事：测试指标、测试项、测试功能、测试周期',
      '逐条拆解指标，确认可测性：测试方法、所需设备、判定标准',
      '测试周期初评：测试项数量 × 单项时长 × 轮次，留 20% 余量',
      '把项目信息（型号 / 规格书版本 / 负责人 / 周期）填完整'
    ], deliver:['需求与规格书基线','指标清单','可测性确认结论','周期初评表']},
  plan: {short:'方案评审', steps:[
      '编写测试方案 / 计划：范围、策略、资源、进度、风险与应对',
      '在「测试项台账」建全量测试项，逐项定负责人与判定标准',
      '准备测试记录表模板，下发到每一位执行人',
      '建「指标追溯矩阵」：指标 → 测试项 → 结果 → 证据，一条不漏',
      '组织评审会（项目组 + 需方），记录评审结论与必改项',
      '必改项闭环后逐条勾门禁；通过即周期基线化，不得随意变更'
    ], deliver:['测试方案 / 计划','测试项台账','记录表模板','指标追溯矩阵','评审记录']},
  env: {short:'环境准备', steps:[
      '样机、仪器、账号、场地逐项落实并签收（缺一项就写缺口与预计到位时间）',
      '被测版本冻结：记录版本号、构建时间、变更说明，之后不再改包',
      '环境检查：标定 / 校准有效期、场地电磁环境、供电与网络',
      '执行人到位并读方案，确认记录与证据留存要求'
    ], deliver:['资源签收单','版本冻结单','环境检查表']},
  rd: {short:'研发测试', steps:[
      '先内场：版本更新项 / 新增项 / BUG 修复项逐项验证',
      '再指标：灵敏度、功率、高低温',
      '后外场：侦测性能、通信干扰、导航干扰、导航诱骗、干通比',
      '发现问题立刻到「缺陷管理」登记（等级 / 复现步骤 / 影响面），测试项状态改阻塞',
      '每完成一项：台账更新进度与判定结果，证据填到「证据 / 数据位置」或上传附件',
      '缺陷修复后回归验证并关闭；无法关闭的走书面豁免'
    ], deliver:['测试记录表','缺陷清单','回归验证记录']},
  iter: {short:'版本迭代', steps:[
      '登记版本轮次：版本号、变更内容、影响面（不登记就无法界定回归范围）',
      '按变更影响圈定回归范围，不要盲目全量重测',
      '内场回归：更新项 / 新增项 / BUG 修复项 + 灵敏度、功率、高低温',
      '外场回归：核心指标按影响面选做，变更涉及射频必做干扰类',
      '冒烟通过 + 回归完成 + 无新增致命/严重 → 出轮次结论（通过 / 有条件 / 打回研发）'
    ], deliver:['版本轮次记录','回归范围表','轮次结论']},
  accept: {short:'验收测试', steps:[
      '与需方确认验收方案与指标清单，逐条定判定口径（避免事后扯皮）',
      '内场：灵敏度、功率、高低温、防水、振动、软件平台、其他测试项',
      '外场：侦测性能、通信干扰、导航干扰、导航诱骗、干通比',
      '逐条指标给结论（通过 / 不通过 / 有条件通过），同步归集原始证据',
      '独立判定：结论由测试负责人签署，项目组口头说明不作为通过依据',
      '偏差与豁免必须书面审批，随报告一并归档'
    ], deliver:['验收报告','指标逐项结论表','原始证据包','签署页']},
  assist: {short:'部门协助', steps:[
      '接收直属领导书面下发的协助需求（口头需求先补书面）',
      '明确四要素：协助项目、地点、时间周期、交付内容',
      '资源到位确认：人、设备、场地、权限',
      '按计划执行并留执行记录（时间、内容、结果）',
      '结果反馈给需求方，回执与记录一并归档'
    ], deliver:['协助需求单','协助执行记录','结果反馈']},
  report: {short:'报告归档', steps:[
      '汇总各任务线结论，编写测试 / 验收报告（结论、数据、偏差、建议）',
      '核对缺陷与变更是否全部闭环（关闭或书面豁免）',
      '争议事项复核，偏差审批留痕',
      '文档与原始证据归档，关闭归档清单，项目收尾'
    ], deliver:['测试 / 验收报告','缺陷闭环清单','争议复核记录','归档清单']}
};
STAGES.forEach(st => { const x = STAGE_SOP[st.id]; if (x) { st.sop = x.steps; st.deliver = x.deliver; st.short = x.short; } });

/* 当前阶段：第一个门禁未通过的已下发阶段 */
function currentStage() {
  const order = [...FRONT_CHAIN, ...PAR_TRACKS.filter(trackOn), 'report'];
  return order.map(stageById).find(x => x && !gateReady(x)) || stageById('report');
}

/* 流程模型（5 个层级）：
   第 1–3 层 S1 公共前置 → S2 方案评审 🚦 → S3 环境准备，串行硬门禁；
   第 4 层 S4「测试任务执行」是一个【同级节点层】：研发测试 / 版本迭代测试 / 验收测试 / 部门协助
   四类任务同处这一层、地位相同、互不为前置，由直属领导/项目下发的任务单判定做哪一类（通常只有一类，
   同时下发多类时才并行开展）；第 5 层 S5 报告与归档汇入收口，要求已下发任务全部准出。 */
const FRONT_CHAIN = ['pre', 'plan', 'env'];
const PAR_TRACKS = ['rd', 'iter', 'accept', 'assist'];
/* 层级结构：用于步骤条、层级导航与「第几层」表述——同一层内的节点是同级关系 */
const LEVELS = [
  {no:'S1', ids:['pre'], name:'公共前置'},
  {no:'S2', ids:['plan'], name:'方案评审'},
  {no:'S3', ids:['env'], name:'环境准备'},
  {no:'S4', ids:PAR_TRACKS, name:'测试任务执行', same:true},
  {no:'S5', ids:['report'], name:'报告归档'}
];
const levelOf = id => LEVELS.findIndex(l => l.ids.indexOf(id) >= 0);
const DEFAULT_TRACKS = {rd:true, iter:false, accept:false, assist:false};

const STATUS = {
  todo:{t:'未开始', cls:'m', bar:''}, doing:{t:'进行中', cls:'b', bar:''},
  blocked:{t:'阻塞', cls:'r', bar:'r'}, done:{t:'已完成', cls:'g', bar:'g'},
  waived:{t:'豁免', cls:'o', bar:'o'}
};
const RESULTS = ['', '通过', '不通过', '有条件通过', '不适用'];
const SEVERITY = {s1:{t:'致命'}, s2:{t:'严重'}, s3:{t:'一般'}, s4:{t:'建议'}};
const BUG_STATUS = ['新建', '处理中', '待验证', '已关闭', '延期/豁免'];
const ROUND_TYPES = ['研发版本', '迭代版本', '回归测试', '验收版本'];

/* ---------- 设备二级分类（S4 同级任务层下） ----------
   设备类型（纯侦测 / 纯打击 / 侦测打击诱骗一体 … 可增删改查）
     └ 具体设备（名称 / 型号，可增删改查）
         └ 测试项：由该设备类型绑定的「测试项模板模块」自动调用（模板可增删改查、可排序、可跨类型复制） */
const DEFAULT_DEV_TYPES = [
  {id:'dt_detect', name:'纯侦测类设备', tone:'#0f9d58', note:'只具备侦察 / 探测能力（探测、测向、识别、告警）'},
  {id:'dt_strike', name:'纯打击设备', tone:'#d98012', note:'只具备打击 / 压制能力（打击、干扰、毁伤）'},
  {id:'dt_all', name:'侦测打击诱骗一体设备', tone:'#7c4dff', note:'侦测 + 诱骗 + 打击一体化，含模式切换与联动'}
];
/* 每种设备类型的测试项模板：cat | 名称 | 判定标准/方法 */
const DEFAULT_DEV_TPL = {
  dt_detect: [
    ['侦测','侦测灵敏度','按规格书门限，典型目标可稳定告警'],
    ['侦测','作用距离','≥ 典型目标作用距离要求'],
    ['侦测','测向精度','方位角误差 ≤ 规格要求'],
    ['侦测','频段覆盖范围','覆盖规格书全频段，无漏段'],
    ['侦测','多目标分辨能力','典型多目标场景下分辨正确'],
    ['侦测','虚警率 / 漏报率','连续工作时段内满足指标'],
    ['侦测','扫描周期与刷新率','目标更新周期 ≤ 规格要求'],
    ['软件','平台显示与告警','态势显示、声光告警、日志记录正常'],
    ['环境','高低温工作','+55℃ / -40℃ 各 2h 指标不退化'],
    ['环境','防水 / 振动','按规格书等级试验无异常'],
    ['指标','电磁兼容性','与周边设备互扰在允许范围内']
  ],
  dt_strike: [
    ['打击','打击响应时间','从发现到打击执行 ≤ 规格要求'],
    ['打击','打击精度 / 命中率','按靶标试验，命中率 ≥ 规格要求'],
    ['打击','有效作用距离','≥ 规格书要求'],
    ['打击','压制 / 干扰功率','输出功率与干通比达标'],
    ['打击','连续打击能力','多目标连续任务无降级、无过热保护'],
    ['打击','发射 / 启动可靠性','连续 N 次启动成功率 100%'],
    ['安全','安全联锁与急停','联锁、急停、断电保护有效'],
    ['安全','禁区 / 禁打约束','禁打区域与权限管控生效'],
    ['软件','打击决策与上报','目标排序、决策建议、结果上报正确'],
    ['环境','高低温 / 湿热','按规格书剖面试验无异常'],
    ['指标','电磁兼容与自扰','打击时本设备侦测通道不被自扰']
  ],
  dt_all: [
    ['侦测','目标探测与识别','目标类型识别正确率 ≥ 规格要求'],
    ['侦测','跟踪稳定性','连续跟踪不丢失、不跳批'],
    ['侦测','作用距离与测向精度','满足规格书指标'],
    ['诱骗','诱骗信号生成','信号样式、功率、时序可配置'],
    ['诱骗','诱骗成功率','典型场景诱骗成功率 ≥ 规格要求'],
    ['打击','打击精度 / 命中率','按靶标试验达标'],
    ['打击','打击响应时间','从识别到打击执行 ≤ 规格要求'],
    ['联动','侦测 → 打击 联动时延','端到端时延 ≤ 规格要求'],
    ['联动','模式切换（侦测/诱骗/打击）','切换无冲突、状态一致、可回切'],
    ['联动','多任务并发','侦测与打击并发时指标不退化'],
    ['安全','安全管控与禁打约束','权限、禁区、急停生效'],
    ['软件','一体化平台功能','态势、任务管理、日志、复盘功能正常'],
    ['环境','高低温 / 振动','按规格书剖面试验无异常']
  ]
};
const mkTpl = (tid) => (DEFAULT_DEV_TPL[tid] || []).map(x => ({id:uid(), cat:x[0], name:x[1], std:x[2]}));

const DEFAULT_MATRIX = [
  ['侦测灵敏度', '≤ -95 dBm', 'rd|指标|灵敏度测试'],
  ['发射功率', '≥ 20 W', 'rd|指标|功率测试'],
  ['高温工作', '+55℃ 连续工作 2h 指标不退化', 'rd|环境|高低温测试'],
  ['低温工作', '-40℃ 连续工作 2h 指标不退化', 'rd|环境|高低温测试'],
  ['防水等级', 'IP66', 'accept|环境|防水测试'],
  ['振动试验', '按规格书振动剖面无结构/性能损伤', 'accept|环境|振动测试'],
  ['侦测性能（作用距离）', '≥ 典型目标作用距离要求', 'rd|指标|侦测性能测试'],
  ['通信干扰', '干扰距离 / 压制比达标', 'rd|指标|通信干扰测试'],
  ['导航干扰', '干扰距离达标', 'rd|指标|导航干扰测试'],
  ['导航诱骗', '诱骗成功率达标', 'rd|指标|导航诱骗测试'],
  ['干通比', '≥ 规格要求', 'rd|指标|干通比测试'],
  ['软件平台功能', '平台功能项 100% 通过', 'accept|软件|软件平台测试']
];

/* ---------- 工具 ---------- */
const $  = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = s => String(s == null ? '' : s)
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const today = () => { const d = new Date(), p = n => String(n).padStart(2,'0');
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`; };
const lines = s => String(s || '').split('\n').map(x => x.trim()).filter(Boolean);
const stageById = id => STAGES.find(s => s.id === id) || STAGES[0];
const itemKey = (sid, cat, name) => `${sid}|${cat}|${name}`;

/* ---------- 设备库（S4 二级分类）辅助 ---------- */
const devTypes = () => (S && S.devTypes) || [];
const devList = () => (S && S.devices) || [];
const devTypeById = id => devTypes().find(t => t.id === id);
const devTypeName = tid => { const t = devTypeById(tid); return t ? t.name : '未分类设备'; };
const devTone = tid => { const t = devTypeById(tid); return t ? t.tone : '#64748b'; };
const devById = id => devList().find(d => d.id === id);
const devTplOf = tid => (S && S.devTpl && S.devTpl[tid]) || [];
const devItemKey = (sid, devId, tplId) => `dev|${sid}|${devId}|${tplId}`;
/** 测试项 key：静态项用 stage|cat|name，设备项用 dev|stage|devId|tplId（预置在 it[2]） */
const keyOf = (st, it) => it[2] || itemKey(st.id, it[0], it[1]);
/** 测试项展示名（用于提示、弹窗标题） */
function itemLabel(key) {
  if (key.indexOf('dev|') === 0) {
    const [, , devId, tplId] = key.split('|');
    const d = devById(devId);
    const t = d ? devTplOf(d.tid).find(x => x.id === tplId) : null;
    return (d ? d.name : '已删除设备') + (t ? ' · ' + t.name : '');
  }
  return key.split('|')[2] || key;
}
/** S4 同级任务下：按「设备类型 → 具体设备 → 该类型测试项模板」展开的分组（设备项随设备实例化） */
function devGroups(st) {
  if (!st.track) return [];
  if (!devList().length) return [];
  const byType = {};
  devList().forEach(d => { if (devTypeById(d.tid)) (byType[d.tid] = byType[d.tid] || []).push(d); });
  const out = [];
  devTypes().forEach(t => {
    (byType[t.id] || []).forEach(d => {
      const tpl = devTplOf(t.id);
      if (!tpl.length) return;
      out.push({
        dev:true, devId:d.id, tid:t.id, tone:t.tone,
        name:`${d.name}${d.model ? '（' + d.model + '）' : ''}`,
        typeName:t.name, model:d.model || '',
        items: tpl.map(x => [x.cat, x.name, devItemKey(st.id, d.id, x.id), x.std])
      });
    });
  });
  return out;
}
/** 阶段的全部测试项分组：静态分组 + 设备分组 */
const stageGroups = st => st.groups.concat(devGroups(st));
const dayNum = d => { const t = Date.parse(d); return isNaN(t) ? null : t / 86400000; };

/* ---------- 状态 ---------- */
let S = null;

/* 存储键：主数据 / 退出标志 / 记录草稿 / AI 配置 / 退出前快照 */
const EXIT_KEY = LS_KEY + '.exit';
const SNAP_KEY = LS_KEY + '.snaps';   // 兼容旧版（v4.0 快照曾存 localStorage）
const LAST_KEY = LS_KEY + '.lastsnap';
const DRAFT_KEY = LS_KEY + '.draft';
const AI_KEY = 'testboard.ai';

/* 会话级提示标记（不写入备份文件） */
let crashFlag = false, recoveredFlag = false, autoWeeklyNotice = '';
let storageLow = false, storageWarned = false, storageQuota = null;

/* ---------- 多项目工作区 ----------
   一级分类 = 项目任务（每个项目独立存储、独立统计）；
   二级分类 = 项目内的测试流程（S1–S5，第 4 层为同级任务节点）。
   索引存 WS_KEY，各项目状态存 testboard.proj.<id>。 */
const WS_KEY = 'testboard.projects';
let WS = {list: [], active: null};
let wsEmpty = false;          // 项目被全部删除后的空态（此时 S 只是占位，不落盘）
let legacySnapOwner = false;  // 由旧版单项目数据迁移而来的项目（继承旧快照/草稿/退出快照）
let pendingEmbed = null;      // 分享文件在已有数据的环境打开时，暂存嵌入数据供用户选择导入

const projKey = id => 'testboard.proj.' + id;
function loadWS() {
  let d = null;
  try {
    d = JSON.parse(localStorage.getItem(WS_KEY) || 'null');
  } catch (e) {}
  if (!d || typeof d !== 'object') d = {list: [], active: null};
  if (!Array.isArray(d.list)) d.list = [];
  wsInit0(d);
  return d;
}
/** 工作区级别的字段兜底（账户 / 资源调度） */
function wsInit0(d) {
  if (!Array.isArray(d.accounts)) d.accounts = [];
  if (!d.session || typeof d.session !== 'object') d.session = {userId: null};
  if (!d.res || typeof d.res !== 'object') d.res = {types: [], reqs: []};
  if (!Array.isArray(d.res.types) || !d.res.types.length) d.res.types = DEFAULT_RES_TYPES.map(t => Object.assign({}, t));
  if (!Array.isArray(d.res.reqs)) d.res.reqs = [];
  if (!Array.isArray(d.res.templates)) d.res.templates = [];
}
function saveWS() { try { localStorage.setItem(WS_KEY, JSON.stringify(WS)); } catch (e) {} }

/* =========================================================
   账户 / 角色权限（本机轻量身份，非加密级）
   · 未登录 = 本机使用者，按组长权限使用
   · 组长：全部内容可看可改，可建账户、审批资源
   · 组员：可改自己的记录/测试项/缺陷/资源申请；
           他人内容只能看「项目总览进度 + 问题阻碍 + 资源申请（日期/时段）」
   ========================================================= */
const DEFAULT_RES_TYPES = [
  {id:'rt_uav',  name:'无人机',     icon:'🚁', unit:'架',   total:2, tone:'#2f5cf6', note:'含遥控器 / 电池'},
  {id:'rt_gw',   name:'蒲公英网关', icon:'📡', unit:'台',   total:1, tone:'#0f9d58', note:'组网 / 远程接入'},
  {id:'rt_plat', name:'远程平台',   icon:'🖥', unit:'席位', total:3, tone:'#7c4dff', note:'远程控制席位 / 账号'},
  {id:'rt_car',  name:'车辆',       icon:'🚗', unit:'辆',   total:1, tone:'#d98012', note:'外场用车'},
  {id:'rt_pwr',  name:'移动电源',   icon:'🔋', unit:'台',   total:2, tone:'#0891b2', note:'户外供电'}
];
function wsInit() {
  if (!Array.isArray(WS.accounts)) WS.accounts = [];
  if (!WS.session || typeof WS.session !== 'object') WS.session = {userId: null};
  if (!WS.res || typeof WS.res !== 'object') WS.res = {types: [], reqs: []};
  if (!Array.isArray(WS.res.types) || !WS.res.types.length) WS.res.types = DEFAULT_RES_TYPES.map(t => Object.assign({}, t));
  if (!Array.isArray(WS.res.reqs)) WS.res.reqs = [];
  if (!Array.isArray(WS.res.templates)) WS.res.templates = [];
}
function hashPass(s) {
  let h = 5381;
  const str = 'tb::' + String(s == null ? '' : s);
  for (let i = 0; i < str.length; i++) h = ((h * 33) ^ str.charCodeAt(i)) >>> 0;
  return h.toString(36);
}
function curUser() {
  if (!WS.session || !WS.session.userId) return null;
  return (WS.accounts || []).find(a => a.id === WS.session.userId) || null;
}
const isLeader = () => { const u = curUser(); return !u || u.role === 'leader'; };
function meName() { const u = curUser(); return u ? (u.name || u.user) : ''; }
function iAm(name) {
  const u = curUser();
  if (!u) return true;                       // 未登录=本机使用者，视作本人
  return normName(u.name || u.user) === normName(name);
}
/** 权限点：project 项目信息/门禁/阶段 · gate 门禁 · member 组员 · restype 资源类型 · approve 审批 · account 账户 · item 任意测试项 */
function can(kind) {
  if (isLeader()) return true;
  return kind === 'log' || kind === 'bug' || kind === 'issue' || kind === 'resreq' || kind === 'item.mine';
}
function canEditItem(v) { return isLeader() || iAm(v && v.owner); }
const roleTag = () => isLeader() ? '<span class="tag b">👑 组长</span>' : '<span class="tag m">👤 组员</span>';

/* ---------- 资源调度：冲突与排期 ---------- */
const RES_STATUS = {
  pending:  {t:'待审批', k:'o'},
  approved: {t:'已批准', k:'g'},
  rejected: {t:'已驳回', k:'r'},
  done:     {t:'已完成', k:'b'}
};
const resTypes = () => (WS.res && WS.res.types) || [];
const resReqs  = () => (WS.res && WS.res.reqs) || [];
const resTypeById = id => resTypes().find(t => t.id === id) || null;
const minOf = t => { const m = /^(\d{1,2}):(\d{2})$/.exec(String(t || '').trim()); return m ? (+m[1]) * 60 + (+m[2]) : 0; };
const fmtMin = m => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
const overlap = (a, b) => Math.max(0, Math.min(a.e, b.e) - Math.max(a.s, b.s));

/** 计算每条申请是否与其他申请在「同资源 + 同日期 + 时段重叠 + 超出总量」上冲突；
    晚提交（created 较大）的一方被判为冲突方，需要向先提交者协商交叉测试 */
function resConflictMap() {
  const list = resReqs().filter(r => r.status === 'approved' || r.status === 'pending');
  const map = {};
  const byKey = {};
  list.forEach(r => { const k = r.typeId + '@' + r.date; (byKey[k] = byKey[k] || []).push(r); });
  Object.keys(byKey).forEach(k => {
    const arr = byKey[k].sort((a, b) => (a.created || 0) - (b.created || 0));  // 先提交在前
    const total = (resTypeById(arr[0].typeId) || {}).total || 0;
    arr.forEach(r => {
      const a = {s: minOf(r.start), e: Math.max(minOf(r.end), minOf(r.start) + 1)};
      let used = 0, withIds = [], over = false;
      arr.forEach(o => {
        if (o.id === r.id) return;
        const b = {s: minOf(o.start), e: Math.max(minOf(o.end), minOf(o.start) + 1)};
        if (overlap(a, b) > 0) {
          withIds.push(o.id);
          if ((o.created || 0) < (r.created || 0)) used += Number(o.qty) || 1;   // 先提交者已占用
        }
      });
      over = total > 0 && (used + (Number(r.qty) || 1)) > total;
      if (over) map[r.id] = {withIds, used, total};
    });
  });
  return map;
}
function resSave() { saveWS(); }
function projState(id) {
  const r = (() => { try { return localStorage.getItem(projKey(id)); } catch (e) { return null; } })();
  if (!r) return null;
  try {
    const st = migrate(JSON.parse(r));
    return st.pid ? st : null;
  } catch (e) {
    /* 兜底：迁移失败也不能让 load() 判定为「数据缺失」而把用户数据覆盖成默认状态，
       这里做一次最小化重组，尽量保住已保存内容 */
    try {
      const raw = JSON.parse(r);
      const st = Object.assign(defaultState(), raw, {pid: id});
      st.meta = Object.assign(defaultState().meta, raw.meta || {});
      return st;
    } catch (e2) { return null; }
  }
}
function projNameOf(id) { const st = projState(id); return st ? (st.meta.name || '未命名项目') : '（数据缺失）'; }
/** 临时切换全局 S 做跨项目统计（同步计算，禁止在里面调用 save/render） */
function withState(st, fn) { const old = S; S = st; try { return fn(); } finally { S = old; } }

function switchProject(id) {
  if (!id || id === WS.active) return;
  if (!WS.list.some(p => p.id === id)) return;
  flushNow();
  snapCache = null; snapsReady = false; snapDirty = false;
  WS.active = id; saveWS();
  S = projState(id) || defaultState();
  if (!S.pid) S.pid = id;
  if (!S.view) S.view = 'dash';
  initSnaps();
  closeModal();
  render();
  toast('已切换到：' + (S.meta.name || '未命名项目'));
}
function createProject(meta) {
  const st = defaultState();
  wsEmpty = false;
  st.pid = uid();
  Object.assign(st.meta, meta || {});
  WS.list.push({id: st.pid, created: Date.now()});
  WS.active = st.pid; saveWS();
  try { localStorage.setItem(projKey(st.pid), JSON.stringify(st)); } catch (e) {}
  return st;
}
function deleteProject(id, skipConfirm) {
  if (!skipConfirm && !confirm('确定删除该项目？\n其全部测试项进度、门禁、缺陷、轮次、记录都会删除且无法恢复。\n建议先「分享 / 导出」做备份。')) return;
  const wasActive = id === WS.active;
  WS.list = WS.list.filter(p => p.id !== id);
  try { localStorage.removeItem(projKey(id)); } catch (e) {}
  if (!WS.list.length) {
    /* 删光了：进入空态引导，不再凭空造一个项目（否则用户会以为没删掉） */
    wsEmpty = true;
    S = defaultState(); S.pid = '';
    S.view = 'projects';
  } else {
    wsEmpty = false;
    if (WS.active === id) WS.active = WS.list[0].id;
    if (wasActive) S = projState(WS.active) || defaultState();
  }
  saveWS();
  snapCache = null; snapsReady = false;
  initSnaps();
  S.view = 'projects';
  flushSave(); render();
  toast(wsEmpty ? '项目已删除（当前没有任何项目，可新建或导入备份）' : '项目已删除');
}

function defaultState() {
  return {
    v: 4,
    meta: {name:'XX 型设备 · 测试项目', model:'', spec:'规格书 V1.0', owner:'', pm:'', period:'', note:'',
      tracks:Object.assign({}, DEFAULT_TRACKS), taskDoc:'', taskDecided:false},
    items:{}, gates:{}, stageDates:{},
    bugs:[], rounds:[],
    /* 设备二级分类：类型 → 设备 → 该类型测试项模板 */
    devTypes: DEFAULT_DEV_TYPES.map(t => Object.assign({}, t)),
    devices: [],
    devTpl: DEFAULT_DEV_TYPES.reduce((o, t) => (o[t.id] = mkTpl(t.id), o), {}),
    devUI: {curTid: 'dt_detect', open: {}},
    matrix: DEFAULT_MATRIX.map(m => ({id:uid(), metric:m[0], spec:m[1], itemKey:m[2], method:'', evidence:'', conclusion:''})),
    logs:[], issueFlags:{},
    members:[], weeklies:[],
    backup:{auto:true, interval:3, keep:12, folder:'', pending:'', lastSnap:0, lastFolder:0, autoWeekly:true},
    view:'dash', open:{},
    filter:{stage:'all', status:'all', q:''},
    bugFilter:{sev:'all', status:'all', q:''}
  };
}

function migrate(d) {
  const base = defaultState();
  const s = Object.assign(base, d, {meta: Object.assign(base.meta, d.meta || {})});
  s.v = 4;
  if (!s.pid) s.pid = uid();
  s.meta.tracks = Object.assign({}, DEFAULT_TRACKS, (d.meta && d.meta.tracks) || {});
  s.backup = Object.assign(base.backup, d.backup || {});
  if (!Array.isArray(s.members)) s.members = [];
  if (!Array.isArray(s.weeklies)) s.weeklies = [];
  if (!Array.isArray(s.bugs)) s.bugs = [];
  if (!Array.isArray(s.rounds)) s.rounds = [];
  if (!Array.isArray(s.logs)) s.logs = [];
  if (!Array.isArray(s.matrix)) s.matrix = base.matrix;
  if (!s.issueFlags) s.issueFlags = {};
  /* 设备库（S4 二级分类）迁移：老项目自动补齐默认类型与模板 */
  if (!Array.isArray(s.devTypes) || !s.devTypes.length) s.devTypes = DEFAULT_DEV_TYPES.map(t => Object.assign({}, t));
  if (!Array.isArray(s.devices)) s.devices = [];
  if (!s.devTpl || typeof s.devTpl !== 'object') s.devTpl = {};
  s.devTypes.forEach(t => { if (!Array.isArray(s.devTpl[t.id])) s.devTpl[t.id] = mkTpl(t.id); });
  if (!s.devUI) s.devUI = {curTid: s.devTypes[0].id, open:{}};
  if (!s.devUI.open) s.devUI.open = {};
  /* 注意：这里只能用局部 s，绝不能调用 devTypes() 等依赖全局 S 的函数——
     启动时 S 尚未赋值（S = load() 之前就要 migrate），引用会抛异常导致数据被误判为损坏 */
  if (!s.devTypes.some(t => t.id === s.devUI.curTid)) s.devUI.curTid = s.devTypes[0].id;
  return s;
}

function load() {
  WS = loadWS();
  let hadWS = false;
  try { hadWS = !!localStorage.getItem(WS_KEY); } catch (e) {}
  // 0) 工作区为空 → 迁移旧版单项目数据，或接收文件内嵌的分享数据，或新建
  if (!WS.list.length && !hadWS) {
    // 首次使用：给一个初始项目
  } else if (!WS.list.length) {
    /* 曾经有工作区但现在没有项目：说明用户把项目都删了 → 保持空态，
       绝不自动新建（否则用户会以为删除失败） */
    wsEmpty = true;
    const ph = defaultState(); ph.pid = ''; ph.view = 'projects';
    return ph;
  } else if (window.EMBEDDED_DATA && !window.__embedConsumed) {
    let first = null;
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        first = migrate(JSON.parse(raw));
        legacySnapOwner = true;
        // 草稿一次性迁移到项目键下
        try {
          const dr = localStorage.getItem(DRAFT_KEY);
          if (dr) localStorage.setItem(DRAFT_KEY + '.' + first.pid, dr);
        } catch (e) {}
        try { localStorage.removeItem(LS_KEY); } catch (e) {}
      }
    } catch (e) {}
    if (!first && window.EMBEDDED_DATA) {
      try { first = migrate(window.EMBEDDED_DATA); first.embedded = true; } catch (e) {}
    }
    if (!first) first = defaultState();
    first.pid = first.pid || uid();
    WS = {list: [{id: first.pid, created: Date.now()}], active: first.pid};
    try { localStorage.setItem(projKey(first.pid), JSON.stringify(first)); } catch (e) {}
    saveWS();
  } else if (window.EMBEDDED_DATA && !window.__embedConsumed) {
    // 本机已有项目，又打开了含数据的分享文件 → 暂存，让用户决定是否导入为新项目
    pendingEmbed = window.EMBEDDED_DATA;
    window.__embedConsumed = true;
  }
  // 1) 活动项目
  let st = projState(WS.active);
  if (!st && WS.list.length) st = projState(WS.list[0].id);
  if (!st) {
    // 活动项目数据缺失/损坏 → 先尝试用最近一份快照抢救，仍不行才新建（并给出恢复提示）
    const id = (WS.active && WS.list.some(p => p.id === WS.active)) ? WS.active : (WS.list[0] && WS.list[0].id) || uid();
    let salvaged = null;
    try {
      const lastRaw = localStorage.getItem(LAST_KEY + '.' + id);
      if (lastRaw) {
        const j = JSON.parse(JSON.parse(lastRaw).json);
        salvaged = Object.assign(defaultState(), j, {pid: id});
        salvaged.meta = Object.assign(defaultState().meta, j.meta || {});
      }
    } catch (e) {}
    st = salvaged || defaultState();
    st.pid = id;
    recoveredFlag = true;
    if (!WS.list.some(p => p.id === st.pid)) WS.list.push({id: st.pid, created: Date.now()});
    try { localStorage.setItem(projKey(st.pid), JSON.stringify(st)); } catch (e) {}
    saveWS();
  }
  WS.active = st.pid; saveWS();
  // 崩溃检测：上次退出时未写入正常退出标志
  try { if (localStorage.getItem(EXIT_KEY) === '0') crashFlag = true; } catch (e) {}
  return st;
}

/* ---------- 自动保存 + 自动快照（防宕机 / 卡死丢数据） ---------- */
let saveTimer = null, snapTimer = null, dirty = false;

function save() {
  dirty = true;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(flushSave, 120);
}

const canPersist = () => !wsEmpty && !!(S && S.pid);

function flushSave() {
  if (!canPersist()) { try { localStorage.setItem(EXIT_KEY, '1'); } catch (e) {} return; }
  try {
    if (dirty) { pushSnap('自动'); dirty = false; }
    localStorage.setItem(projKey(S.pid), JSON.stringify(S));
    localStorage.setItem(EXIT_KEY, '0'); // 0=会话进行中，正常退出时置 1
    storageLow = false;
    updateSaveMark();
    scheduleFolderSync();
  } catch (e) {
    // 配额不足：先收缩快照再试一次（快照大头已迁到 IndexedDB，这里通常能救回）
    try {
      trimSnaps(3);
      try { localStorage.removeItem(SNAP_KEY); localStorage.removeItem(LAST_KEY); } catch (e3) {}
      localStorage.setItem(projKey(S.pid), JSON.stringify(S));
      localStorage.setItem(EXIT_KEY, '0');
      storageLow = false;
      updateSaveMark();
    } catch (e2) {
      storageLow = true;
      const vb = $('#btnVault');
      if (vb) vb.classList.add('warn');
      if (!storageWarned) {
        storageWarned = true;
        toast('浏览器存储空间不足：本次改动暂存内存，请到「数据保险箱」导出备份并清理');
      }
    }
  }
}

/** 退出前紧急落盘（关闭标签页 / 切后台 / 刷新 / 崩溃前） */
function flushNow() {
  try {
    clearTimeout(saveTimer);
    if (canPersist()) {
      localStorage.setItem(projKey(S.pid), JSON.stringify(S));
      saveLastSnap();
    }
    localStorage.setItem(EXIT_KEY, '1');
  } catch (e) {}
  if (!wsEmpty) syncFolderNow();
}

function updateSaveMark() {
  const el = $('#lastSave');
  if (el) {
    const t = new Date().toLocaleTimeString('zh-CN', {hour12:false});
    el.innerHTML = '已保存 ' + t + (S.backup && S.backup.folder
      ? `<br>↳ 已同步文件夹：${esc(S.backup.folder)}` : '');
  }
  const vb = $('#btnVault');
  if (vb && !(crashFlag || recoveredFlag)) vb.classList.remove('warn');
}

/* ---- 快照存储：IndexedDB 优先（配额大 + gzip 压缩），localStorage 仅作兜底 ----
   说明：浏览器给 localStorage 的配额只有约 5MB，且所有本地 HTML 页面共享，
   v4.0 把全部快照堆在里面会导致「存储空间不足」。v4.1 起快照改存 IndexedDB
   （配额通常为数百 MB），并启用 gzip 压缩，localStorage 里只保留退出前最后一份。 */
const SNAP_IDB = 'testboard.snaps';
let snapCache = null;      // [{t, reason, size, json}]
let snapsReady = false;    // IDB 是否加载完成（防加载前覆盖写入）
let snapDirty = false;     // 加载完成前有新快照待持久化
let idbBroken = false;     // IDB 不可用（如 Firefox 本地文件）→ localStorage 兜底
let snapPersisting = Promise.resolve();

function idbSnapOpen() {
  return new Promise((res, rej) => {
    let rq;
    try { rq = indexedDB.open(SNAP_IDB, 1); } catch (e) { return rej(e); }
    rq.onupgradeneeded = () => { try { rq.result.createObjectStore('s'); } catch (e) {} };
    rq.onsuccess = () => res(rq.result);
    rq.onerror = () => rej(rq.error || new Error('idb 打开失败'));
    rq.onblocked = () => rej(new Error('idb 被占用'));
  });
}
async function deflate(text) {
  if (typeof CompressionStream !== 'function') return null;
  try {
    const cs = new CompressionStream('gzip');
    const w = cs.writable.getWriter();
    w.write(new TextEncoder().encode(text));
    w.close();
    const buf = new Uint8Array(await new Response(cs.readable).arrayBuffer());
    // 只有确实压得更小才采用（极小或近乎不可压缩的内容直接存原文）
    if (buf.length >= text.length) return null;
    return Array.from(buf); // 普通字节数组：结构化克隆 / JSON 均安全
  } catch (e) { return null; }
}
async function inflate(gz) {
  const bytes = gz instanceof Uint8Array ? gz : new Uint8Array(Array.isArray(gz) ? gz : gz);
  const ds = new DecompressionStream('gzip');
  const w = ds.writable.getWriter();
  w.write(bytes);
  w.close();
  return await new Response(ds.readable).text();
}

function lsSnapList() {
  try { const l = JSON.parse(localStorage.getItem(SNAP_KEY) || '[]'); return Array.isArray(l) ? l : []; }
  catch (e) { return []; }
}
/** 同步读取（内存缓存） */
function snapList() { return snapCache || []; }

/** 启动时加载：IndexedDB → 迁移旧 localStorage 快照 → 合并退出前快照（按项目隔离） */
async function initSnaps() {
  const skey = 'list.' + S.pid;
  let list = [];
  try {
    const db = await idbSnapOpen();
    const raw = await new Promise(r => {
      const rq = db.transaction('s', 'readonly').objectStore('s').get(skey);
      rq.onsuccess = () => { r(rq.result || []); db.close(); };
      rq.onerror = () => { r([]); db.close(); };
    });
    for (const e of (Array.isArray(raw) ? raw : [])) {
      try {
        if (e.gz) list.push({t: e.t, reason: e.reason, size: e.size, json: await inflate(e.gz)});
        else if (e.json) list.push(e);
      } catch (err) {}
    }
  } catch (e) { idbBroken = true; }
  // 旧版：快照曾存 localStorage / 无项目分区的 IDB 键 → 迁移过来并立即清掉
  const legacy = legacySnapOwner ? lsSnapList() : [];
  let legacyIdb = [];
  if (legacySnapOwner) {
    try {
      const db = await idbSnapOpen();
      const rawOld = await new Promise(r => {
        const rq = db.transaction('s', 'readonly').objectStore('s').get('list');
        rq.onsuccess = () => { r(rq.result || []); db.close(); };
        rq.onerror = () => { r([]); db.close(); };
      });
      for (const e of (Array.isArray(rawOld) ? rawOld : [])) {
        try {
          if (e.gz) legacyIdb.push({t: e.t, reason: e.reason, size: e.size, json: await inflate(e.gz)});
          else if (e.json) legacyIdb.push(e);
        } catch (err) {}
      }
      if (legacyIdb.length) {
        try {
          const db2 = await idbSnapOpen();
          db2.transaction('s', 'readwrite').objectStore('s').remove('list');
        } catch (e2) {}
      }
    } catch (e) {}
  }
  const incoming = legacy.concat(legacyIdb);
  if (incoming.length) {
    const have = new Set(list.map(x => x.t));
    incoming.forEach(e => {
      if (e && e.t && typeof e.json === 'string' && !have.has(e.t)) {
        try { JSON.parse(e.json); list.push(e); have.add(e.t); } catch (err) {} // 跳过损坏条目
      }
    });
    list.sort((a, b) => b.t - a.t);
    try { localStorage.removeItem(SNAP_KEY); } catch (e) {}
  }
  // 上次退出前的快照（localStorage 单份，同步写入的那份）
  try {
    const lk = legacySnapOwner ? LAST_KEY : null;
    const lastRaw = localStorage.getItem(LAST_KEY + '.' + S.pid) || (lk ? localStorage.getItem(lk) : null);
    const last = JSON.parse(lastRaw || 'null');
    if (last && last.json && !list.some(x => x.t === last.t)) {
      list.unshift(last);
      list.sort((a, b) => b.t - a.t);
    }
    if (lk) { try { localStorage.removeItem(lk); } catch (e) {} }
  } catch (e) {}
  // 加载期间若已有新快照产生（内存里），一并并入，避免被覆盖
  if (snapCache && snapCache.length) {
    const have = new Set(list.map(x => x.t));
    snapCache.forEach(e => { if (!have.has(e.t)) { list.push(e); have.add(e.t); } });
    list.sort((a, b) => b.t - a.t);
  }
  snapCache = list;
  snapsReady = true;
  snapDirty = false;
  snapPersist(); // 无论是否有迁移内容都落一次盘，保证快照进 IndexedDB
  if (incoming.length) flushSave(); // 腾出了空间，主数据重写一次
}

/** 异步持久化（串行化，避免并发互相覆盖） */
function snapPersist() {
  if (!snapsReady) { snapDirty = true; return; }
  snapPersisting = snapPersisting.then(() => snapPersistNow()).catch(() => {});
}
async function snapPersistNow() {
  const keep = clamp(Number(S.backup.keep) || 10, 3, 60);
  const list = (snapCache || []).slice(0, keep);
  const out = [];
  for (const e of list) {
    try {
      const gz = await deflate(e.json);
      out.push(gz ? {t: e.t, reason: e.reason, size: e.size, gz} : {t: e.t, reason: e.reason, size: e.size, json: e.json});
    } catch (err) { out.push({t: e.t, reason: e.reason, size: e.size, json: e.json}); }
  }
  if (!idbBroken) {
    try {
      const db = await idbSnapOpen();
      await new Promise(r => {
        const tx = db.transaction('s', 'readwrite');
        tx.objectStore('s').put(out, 'list.' + S.pid);
        tx.oncomplete = () => { r(true); db.close(); };
        tx.onerror = () => { r(false); db.close(); };
      });
      return;
    } catch (e) { idbBroken = true; }
  }
  // 兜底：localStorage（只留少量，避免吃满配额）
  try { localStorage.setItem(SNAP_KEY + '.' + S.pid, JSON.stringify(out.slice(0, 5).map(e => ({t: e.t, reason: e.reason, size: e.size, json: e.json})))); } catch (e) {}
}
function trimSnaps(n) {
  snapCache = (snapCache || []).slice(0, Math.max(1, n));
  snapPersist();
}
function clearSnapsAll() {
  snapCache = [];
  snapPersist();
  try { localStorage.removeItem(SNAP_KEY + '.' + S.pid); localStorage.removeItem(LAST_KEY + '.' + S.pid); } catch (e) {}
}
function pushSnap(reason) {
  if (!canPersist()) return;
  try {
    const json = JSON.stringify(S);
    const manual = reason === '手动';
    snapCache = snapCache || [];
    // 状态没变就不重复存（手动快照除外：用户点了就要给一份）
    if (!manual && snapCache.length && snapCache[0].json === json) return;
    // 20 秒内的连续自动快照合并，防止操作密集时快照泛滥
    if (!manual && snapCache.length && Date.now() - snapCache[0].t < 20000 && snapCache[0].reason === reason) snapCache.shift();
    snapCache.unshift({t: Date.now(), reason: reason || '自动', size: json.length, json: json});
    const keep = clamp(Number(S.backup.keep) || 10, 3, 60);
    while (snapCache.length > keep) snapCache.pop();
    snapPersist();
  } catch (e) {}
}
/** 退出前：同步把最新一份塞进 localStorage（IDB 来不及写盘） */
function saveLastSnap() {
  try {
    const s = (snapCache || [])[0];
    if (s) localStorage.setItem(LAST_KEY + '.' + S.pid, JSON.stringify({t: s.t, reason: '退出前', size: s.size, json: s.json}));
  } catch (e) {}
}

function restoreSnap(t) {
  const s = snapList().find(x => x.t === Number(t));
  if (!s) { toast('快照不存在'); return; }
  try {
    S = migrate(JSON.parse(s.json));
    S.view = 'vault';
    closeModal(); flushSave(); render(); toast('已回滚到该快照');
  } catch (e) { toast('快照损坏，无法恢复'); }
}

function startAutoBackup() {
  if (snapTimer) clearInterval(snapTimer);
  const min = clamp(Number(S.backup.interval) || 3, 1, 60);
  snapTimer = setInterval(() => {
    if (!S.backup || S.backup.auto === false) return;
    flushSave();
  }, min * 60000);
}

/* ---- 存储占用仪表 ---- */
function storageUsage() {
  let total = 0, mine = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      const n = (k.length + String(localStorage.getItem(k) || '').length) * 2;
      total += n;
      if (k.indexOf('testboard') === 0) mine += n;
    }
  } catch (e) {}
  const snapBytes = (snapCache || []).reduce((a, b) => a + (b.size || 0), 0);
  return {total, mine, snapBytes};
}

/* ---------- 真实文件夹直连（File System Access API） ---------- */
const FS_OK = typeof window.showDirectoryPicker === 'function';
let dirHandle = null;

function idbOpen() {
  return new Promise((res, rej) => {
    let rq;
    try { rq = indexedDB.open('testboard.fs', 1); } catch (e) { return rej(e); }
    rq.onupgradeneeded = () => { try { rq.result.createObjectStore('kv'); } catch (e) {} };
    rq.onsuccess = () => res(rq.result);
    rq.onerror = () => rej(rq.error || new Error('idb'));
  });
}
async function idbGet(k) {
  try {
    const db = await idbOpen();
    return await new Promise(r => {
      const rq = db.transaction('kv', 'readonly').objectStore('kv').get(k);
      rq.onsuccess = () => { r(rq.result); db.close(); };
      rq.onerror = () => { r(null); db.close(); };
    });
  } catch (e) { return null; }
}
async function idbSet(k, v) {
  try {
    const db = await idbOpen();
    return await new Promise(r => {
      const tx = db.transaction('kv', 'readwrite');
      tx.objectStore('kv').put(v, k);
      tx.oncomplete = () => { r(true); db.close(); };
      tx.onerror = () => { r(false); db.close(); };
    });
  } catch (e) { return false; }
}

async function writeIn(dir, name, text) {
  const fh = await dir.getFileHandle(name, {create: true});
  const w = await fh.createWritable();
  await w.write(text);
  await w.close();
}
async function subDir(root, name) {
  return await root.getDirectoryHandle(name, {create: true});
}
function stampNow() {
  const d = new Date(), p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}
async function rotateBackups(dir) {
  try {
    const names = [];
    for await (const [n, h] of dir.entries()) {
      if (h.kind === 'file' && /\.json$/.test(n)) names.push(n);
    }
    names.sort().reverse();
    const keep = clamp(Number(S.backup.keep) || 12, 3, 200);
    for (const n of names.slice(keep)) { try { await dir.removeEntry(n); } catch (e) {} }
  } catch (e) {}
}

/** 把全部项目写入已绑定的数据文件夹 */
async function syncFolder(manual) {
  if (!dirHandle) return false;
  try {
    const payload = workspacePayload();
    const json = JSON.stringify(payload, null, 2);
    await writeIn(dirHandle, 'workspace.json', json);
    // 每个项目单独一份，便于直接查看/复用
    try {
      const pj = await subDir(dirHandle, 'projects');
      for (const p of payload.projects) {
        const nm = ((p.state.meta.name || '未命名').replace(/[\\/:*?"<>|]/g, '_').slice(0, 40)) + '_' + p.id + '.json';
        await writeIn(pj, nm, JSON.stringify(p.state, null, 2));
      }
    } catch (e) {}
    const bk = await subDir(dirHandle, 'backups');
    await writeIn(bk, `备份_${stampNow()}.json`, json);
    await rotateBackups(bk);
    S.backup.lastFolder = Date.now();
    return true;
  } catch (e) {
    if (manual) toast('写入文件夹失败：' + ((e && e.message) || e));
    return false;
  }
}
let folderTimer = null;
function scheduleFolderSync() {
  if (!dirHandle) return;
  clearTimeout(folderTimer);
  folderTimer = setTimeout(() => syncFolder(false), 3000);
}
function syncFolderNow() {
  if (!dirHandle) return;
  try { syncFolder(false); } catch (e) {}
}

async function bindFolder() {
  if (!FS_OK) {
    openModal('当前浏览器不支持文件夹直连', `
      <div style="font-size:12.5px;line-height:1.85;color:var(--ink2)">
        自动写入磁盘文件夹依赖浏览器的「文件系统访问」能力，目前仅 <b>Chrome / Edge（含 360、QQ 等 Chromium 内核）</b> 支持，
        且需要通过浏览器打开本文件。<br><br>
        <b>替代方案（效果相同，只是多一步）：</b><br>
        1. 在电脑上新建一个文件夹，例如 <span class="pathbox" style="display:inline-block">测试看板数据</span><br>
        2. 在顶部点「分享 / 导出 → JSON 备份」，把下载的 JSON 存进这个文件夹<br>
        3. 需要时点「导入」选择该文件夹里的 JSON 即可恢复<br><br>
        <b>好消息：</b>即使不绑定文件夹，本看板的<b>自动快照保护依然生效</b>——
        每 ${S.backup.interval || 3} 分钟自动在本地存一份快照，程序卡死或断电也不会丢。
      </div>`,
      `<button class="btn primary" data-close>知道了</button>`);
    return;
  }
  try {
    const h = await window.showDirectoryPicker({id: 'testboard', mode: 'readwrite'});
    dirHandle = h;
    await idbSet('dir', h);
    S.backup.folder = h.name;
    S.backup.pending = '';
    const ok = await syncFolder(true);
    flushSave(); render();
    toast(ok ? '已绑定数据文件夹：' + h.name : '已绑定，但首次写入失败');
  } catch (e) {
    if (e && e.name === 'AbortError') return;
    toast('绑定失败：' + ((e && e.message) || e));
  }
}

async function unbindFolder() {
  dirHandle = null;
  S.backup.folder = '';
  S.backup.pending = '';
  try { await idbSet('dir', null); } catch (e) {}
  flushSave(); render(); toast('已解除文件夹绑定');
}

/** 打开时尝试恢复上次授权的文件夹 */
async function restoreFolder() {
  if (!FS_OK) return;
  try {
    const h = await idbGet('dir');
    if (!h) return;
    const q = await h.queryPermission({mode: 'readwrite'});
    if (q === 'granted') { dirHandle = h; S.backup.folder = h.name; S.backup.pending = ''; return; }
    S.backup.pending = h.name;
  } catch (e) {}
}
/** 用户手势下重新申请权限 */
async function reauthFolder() {
  try {
    const h = await idbGet('dir');
    if (!h) { bindFolder(); return; }
    const q = await h.requestPermission({mode: 'readwrite'});
    if (q === 'granted') {
      dirHandle = h; S.backup.folder = h.name; S.backup.pending = '';
      await syncFolder(true); flushSave(); render(); toast('已重新连接：' + h.name);
    } else toast('未获得文件夹权限');
  } catch (e) { toast('重新连接失败：' + ((e && e.message) || e)); }
}

/** 从数据文件夹读取 workspace.json 恢复（兼容旧版 state.json） */
async function loadFromFolder() {
  if (!dirHandle) { toast('请先绑定数据文件夹'); return; }
  try {
    let txt = null, legacy = false;
    try {
      const fh = await dirHandle.getFileHandle('workspace.json');
      txt = await (await fh.getFile()).text();
    } catch (e) {
      const fh = await dirHandle.getFileHandle('state.json');
      txt = await (await fh.getFile()).text();
      legacy = true;
    }
    const d = JSON.parse(txt);
    if (legacy || (!d.kind && d.items)) {
      if (!confirm('检测到旧版单项目数据，将作为新项目导入（不影响现有项目），确定继续？')) return;
      const st = migrate(d);
      st.pid = uid(); st.view = 'dash';
      WS.list.push({id: st.pid, created: Date.now()});
      WS.active = st.pid; saveWS();
      try { localStorage.setItem(projKey(st.pid), JSON.stringify(st)); } catch (e) {}
      snapCache = null; snapsReady = false;
      S = st;
      initSnaps(); flushSave(); render(); toast('已从数据文件夹导入为新项目');
      return;
    }
    if (!confirm(`将用数据文件夹中的 workspace.json 覆盖当前全部 ${WS.list.length} 个项目，确定继续？`)) return;
    applyWorkspace(d);
    toast('已从数据文件夹恢复全部项目');
  } catch (e) { toast('读取失败：' + ((e && e.message) || e)); }
}

/* ---------- 附件存储（IndexedDB，支持 PDF/Word/Excel/图片/压缩包等主流格式） ---------- */
const FILES_IDB = 'testboard.files';
const FILE_MAX = 50 * 1024 * 1024; // 单文件上限 50MB
function fileDb() {
  return new Promise((res, rej) => {
    let rq;
    try { rq = indexedDB.open(FILES_IDB, 1); } catch (e) { return rej(e); }
    rq.onupgradeneeded = () => { try { rq.result.createObjectStore('f'); } catch (e) {} };
    rq.onsuccess = () => res(rq.result);
    rq.onerror = () => rej(rq.error || new Error('idb 打开失败'));
  });
}
async function filePut(rec) {
  try {
    const db = await fileDb();
    return await new Promise(r => {
      const tx = db.transaction('f', 'readwrite');
      tx.objectStore('f').put(rec, rec.fid);
      tx.oncomplete = () => { r(true); db.close(); };
      tx.onerror = () => { r(false); db.close(); };
    });
  } catch (e) { return false; }
}
async function fileGet(fid) {
  try {
    const db = await fileDb();
    return await new Promise(r => {
      const rq = db.transaction('f', 'readonly').objectStore('f').get(fid);
      rq.onsuccess = () => { r(rq.result || null); db.close(); };
      rq.onerror = () => { r(null); db.close(); };
    });
  } catch (e) { return null; }
}
async function fileDel(fid) {
  try {
    const db = await fileDb();
    return await new Promise(r => {
      const tx = db.transaction('f', 'readwrite');
      tx.objectStore('f').remove(fid);
      tx.oncomplete = () => { r(true); db.close(); };
      tx.onerror = () => { r(false); db.close(); };
    });
  } catch (e) { return false; }
}
function fmtBytes(n) {
  n = Number(n) || 0;
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / 1024 / 1024).toFixed(1) + ' MB';
}
function attIcon(n) {
  const e = (String(n || '').split('.').pop() || '').toLowerCase();
  if (e === 'pdf') return '📕';
  if (['doc', 'docx', 'wps', 'dot'].includes(e)) return '📘';
  if (['xls', 'xlsx', 'et', 'csv'].includes(e)) return '📗';
  if (['ppt', 'pptx', 'dps'].includes(e)) return '📙';
  if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg'].includes(e)) return '🖼️';
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(e)) return '🗜️';
  if (['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(e)) return '🎬';
  if (['mp3', 'wav', 'm4a', 'aac'].includes(e)) return '🎧';
  if (['txt', 'md', 'log'].includes(e)) return '📃';
  return '📄';
}
/** 明细弹窗附件区（异步渲染） */
async function loadAttachments(key) {
  const box = $('#attBox');
  if (!box) return;
  const v = getItem(key);
  const fids = v.files || [];
  const recs = [];
  for (const fid of fids) {
    const r = await fileGet(fid);
    recs.push(r ? Object.assign({missing: false}, r) : {fid, missing: true, name: '（数据丢失）'});
  }
  box.innerHTML = recs.length ? recs.map(r => r.missing
    ? `<div class="att"><span class="tag r">丢失</span><span style="font-size:12px;color:var(--mute)">${esc(r.fid)}</span>
       <button class="btn sm ghost" style="margin-left:auto" data-act="delFile" data-fid="${esc(r.fid)}" data-key="${esc(key)}">移除</button></div>`
    : `<div class="att">
        <span style="font-size:16px">${attIcon(r.name)}</span>
        <div style="min-width:0;flex:1">
          <div style="font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(r.name)}</div>
          <div style="font-size:10.5px;color:var(--mute)">${fmtBytes(r.size)} · ${new Date(r.ts).toLocaleString('zh-CN', {hour12:false})}</div>
        </div>
        <span style="display:flex;gap:4px;flex:0 0 auto">
          <button class="btn sm ghost" data-act="dlFile" data-fid="${esc(r.fid)}">下载</button>
          <button class="btn sm ghost" data-act="delFile" data-fid="${esc(r.fid)}" data-key="${esc(key)}">删除</button>
        </span>
      </div>`).join('')
    : '<div style="font-size:12px;color:var(--mute);padding:4px 0">暂无附件。原始记录、测试数据、截图录像等可作为附件存在测试项下。</div>';
}

/* ---------- 派生计算 ---------- */
/** 该任务类型是否由本项目下发（由任务单判定，非流程阶段） */
function trackOn(id) { const t = (S.meta && S.meta.tracks) || {}; return t[id] !== false; }
function stageActive(st) { return !st.track || trackOn(st.id); }
function activeStages() { return STAGES.filter(stageActive); }
function allItems() {
  const out = [];
  activeStages().forEach(st => stageGroups(st).forEach(g => g.items.forEach(it => {
    out.push({sid:st.id, stage:st, group:g.name, cat:it[0], name:it[1], key:keyOf(st, it),
      dev: g.dev ? {id:g.devId, name:g.name, type:g.typeName, tone:g.tone} : null});
  })));
  return out;
}
function getItem(key) {
  return Object.assign({status:'todo', progress:0, owner:'', plan:'', actual:'', result:'', evidence:'', note:'', files:[]}, S.items[key] || {});
}
function setItem(key, patch) {
  const cur = getItem(key);
  S.items[key] = Object.assign(cur, patch);
  if ('status' in patch) {
    if (patch.status === 'done') S.items[key].progress = 100;
    else if (patch.status === 'todo') S.items[key].progress = 0;
  }
  if ('progress' in patch) {
    const p = clamp(Number(patch.progress) || 0, 0, 100);
    S.items[key].progress = p;
    if (p >= 100) S.items[key].status = 'done';
    else if (p > 0 && S.items[key].status === 'todo') S.items[key].status = 'doing';
    else if (p === 0 && S.items[key].status === 'done') S.items[key].status = 'doing';
  }
  save();
}
function stageProgress(st) {
  const list = [];
  stageGroups(st).forEach(g => g.items.forEach(it => list.push(getItem(keyOf(st, it)))));
  return list.length ? Math.round(list.reduce((a,b) => a + (Number(b.progress)||0), 0) / list.length) : 0;
}
function stageStat(st) {
  const s = {total:0, done:0, doing:0, blocked:0, todo:0, waived:0};
  stageGroups(st).forEach(g => g.items.forEach(it => {
    const v = getItem(keyOf(st, it));
    s.total++; s[v.status] = (s[v.status] || 0) + 1;
  }));
  s.pct = stageProgress(st);
  return s;
}
function stageGate(st) {
  let done = 0;
  st.gates.forEach((g, i) => { if (S.gates[`${st.id}|${i}`]) done++; });
  return {done, total: st.gates.length, pct: Math.round(done / st.gates.length * 100)};
}
function gateReady(st) { const g = stageGate(st); return g.total > 0 && g.done === g.total; }
/**
 * 门禁依赖：
 * · 第 1–3 层 S1→S2→S3 串行，前一门禁未过则锁定
 * · 第 4 层四类测试任务为【同级节点】：只依赖 S3 环境就绪，彼此互不为前置；未下发的任务不进入流程
 * · 第 5 层 S5 归档：要求已下发的全部任务类型准出
 */
function stageLocked(st) {
  const fi = FRONT_CHAIN.indexOf(st.id);
  if (fi >= 0) {
    if (fi === 0) return null;
    const prev = stageById(FRONT_CHAIN[fi - 1]);
    return gateReady(prev) ? null : prev;
  }
  if (PAR_TRACKS.includes(st.id)) {
    if (!trackOn(st.id)) return null; // 未下发的不算锁定
    return gateReady(stageById('env')) ? null : stageById('env');
  }
  if (st.id === 'report') {
    const bad = PAR_TRACKS.filter(trackOn).map(stageById).find(t => !gateReady(t));
    return bad || null;
  }
  return null;
}
function overall() {
  const list = allItems().map(i => getItem(i.key));
  const st = {total:list.length, done:0, doing:0, blocked:0, todo:0, waived:0};
  list.forEach(v => { st[v.status] = (st[v.status] || 0) + 1; });
  st.pct = list.length ? Math.round(list.reduce((a,b) => a + (Number(b.progress)||0), 0) / list.length) : 0;
  return st;
}
function bugStat() {
  const b = S.bugs;
  const open = b.filter(x => x.status !== '已关闭');
  const closed = b.filter(x => x.status === '已关闭');
  return {
    total: b.length,
    open: open.length,
    crit: open.filter(x => x.sev === 's1' || x.sev === 's2').length,
    closed: closed.length,
    rate: b.length ? Math.round(closed.length / b.length * 100) : 0,
    bySev: Object.keys(SEVERITY).map(k => ({k, n: b.filter(x => x.sev === k).length}))
  };
}
function health() {
  const o = overall(), b = bugStat();
  const openIss = issuesAll().filter(x => !x.closed).length;
  if (o.blocked > 0 || b.crit > 0) {
    const rs = [o.blocked ? `${o.blocked} 项测试阻塞` : '', b.crit ? `${b.crit} 个致命/严重缺陷未关闭` : ''].filter(Boolean).join(' · ');
    return {k:'risk', t:'风险', rs};
  }
  if (openIss > 3 || b.open > 8) return {k:'warn', t:'关注', rs:`${openIss} 条问题待闭环 · ${b.open} 个缺陷未关闭`};
  return {k:'good', t:'正常', rs:'无阻塞，无严重缺陷'};
}
function issuesAll() {
  const out = [];
  S.logs.forEach(l => ['issue','blocker'].forEach(kind => lines(l[kind + 's']).forEach((tx, i) => {
    const fk = `${l.id}|${kind}|${i}`;
    out.push({id:fk, kind, text:tx, date:l.date, stage:l.stage, closed:!!S.issueFlags[fk]});
  })));
  return out.sort((a,b) => (a.closed - b.closed) || (b.date||'').localeCompare(a.date||''));
}
function resourceAll() {
  const out = [];
  S.logs.forEach(l => lines(l.resources).forEach((tx, i) => {
    const fk = `${l.id}|res|${i}`;
    out.push({id:fk, text:tx, date:l.date, stage:l.stage, closed:!!S.issueFlags[fk]});
  }));
  return out.sort((a,b) => (a.closed - b.closed) || (b.date||'').localeCompare(a.date||''));
}
function ganttRange() {
  const ds = activeStages().map(s => S.stageDates[s.id]).filter(d => d && d.start && d.end);
  if (!ds.length) return null;
  let min = Infinity, max = -Infinity;
  ds.forEach(d => { min = Math.min(min, dayNum(d.start)); max = Math.max(max, dayNum(d.end)); });
  return {min, max, span: Math.max(1, max - min)};
}
function nextBugId() { return 'BUG-' + String(S.bugs.length + 1).padStart(3, '0'); }

/* ---------- 提示 / 弹层 ---------- */
let toastT = null;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 1900);
}
function closeModal() { $('#modal').classList.remove('on'); $('#modal').innerHTML = ''; }
function openModal(title, bodyHTML, footHTML) {
  $('#modal').innerHTML = `<div class="mbox">
    <div class="mh"><h3>${esc(title)}</h3><button class="x" data-close>×</button></div>
    <div class="mb">${bodyHTML}</div>
    ${footHTML ? `<div class="mf">${footHTML}</div>` : ''}
  </div>`;
  $('#modal').classList.add('on');
}
/* =========================================================
   渲染框架
   ========================================================= */
const NAV = [
  {g:'项目任务（一级）', items:[
    {id:'projects', ic:'🗂', t:'项目总览'}
  ]},
  {g:'测试流程（当前项目）', items:[
    {id:'dash', ic:'▦', t:'总览'},
    {id:'flow', ic:'⇢', t:'测试流程'},
    {id:'report', ic:'▤', t:'汇总报告'}
  ]},
  {g:'测试执行', items:[
    {id:'devices', ic:'🎛', t:'设备库（S4 分类）'},
    {id:'items', ic:'☰', t:'测试项台账'},
    {id:'rounds', ic:'⟳', t:'版本轮次'},
    {id:'bugs', ic:'⚠', t:'缺陷管理'},
    {id:'matrix', ic:'⊞', t:'指标追溯'}
  ]},
  {g:'过程记录', items:[
    {id:'logs', ic:'✎', t:'每日记录'},
    {id:'weekly', ic:'🗒', t:'周报'},
    {id:'issues', ic:'⚑', t:'问题与阻碍'}
  ]},
  {g:'团队协作', items:[
    {id:'team', ic:'👥', t:'组员进度'},
    {id:'res', ic:'📦', t:'资源调度'}
  ]},
  {g:'账户与权限', items:[
    {id:'accounts', ic:'🔑', t:'账户管理'}
  ]},
  {g:'数据与备份', items:[
    {id:'vault', ic:'🛡', t:'数据保险箱'}
  ]},
  {g:'帮助', items:[
    {id:'help', ic:'?', t:'使用说明'}
  ]}
];

function render() {
  const o = overall(), b = bugStat(), h = health();
  const iss = issuesAll().filter(x => !x.closed).length;
  const res = resourceAll().filter(x => !x.closed).length;

  $('#nav').innerHTML = NAV.map(g => `
    <div class="nav-group">${g.g}</div>
    ${g.items.map(n => {
      let cnt = '';
      if (n.id === 'projects' && WS.list.length > 1) cnt = WS.list.length;
      else if (n.id === 'items' && o.total - o.done > 0) cnt = o.total - o.done;
      else if (n.id === 'bugs' && b.open > 0) cnt = b.open;
      else if (n.id === 'issues' && (iss + res) > 0) cnt = iss + res;
      else if (n.id === 'rounds' && S.rounds.length) cnt = S.rounds.length;
      else if (n.id === 'logs' && S.logs.length) cnt = S.logs.length;
      else if (n.id === 'weekly' && S.weeklies.length) cnt = S.weeklies.length;
      else if (n.id === 'team' && S.members.length) cnt = S.members.length;
      return `<button class="nav-item ${S.view === n.id ? 'on' : ''}" data-act="view" data-view="${n.id}">
        <span class="ic">${n.ic}</span><span>${n.t}</span>${cnt !== '' ? `<span class="cnt">${cnt}</span>` : ''}
      </button>`;
    }).join('')}`).join('');

  const m = S.meta;
  $('#projName').textContent = wsEmpty ? '暂无项目' : (m.name || '未命名项目');
  $('#projMeta').innerHTML = wsEmpty
    ? '<span>项目已全部删除 · 可新建或导入备份</span>'
    : [
      m.model ? `<span>样机：${esc(m.model)}</span>` : '',
      m.spec ? `<span>${esc(m.spec)}</span>` : '',
      m.period ? `<span>周期：${esc(m.period)}</span>` : '',
      `<span>负责人：${esc(m.owner || '—')}</span>`
    ].filter(Boolean).join('<span style="color:var(--line)">|</span>');
  const ub = $('#btnUser');
  if (ub) {
    const u = curUser();
    ub.textContent = u ? `👤 ${u.name || u.user}（${u.role === 'leader' ? '组长' : '组员'}）` : '👑 组长（本机）';
    ub.className = 'btn' + (u && u.role === 'member' ? '' : ' primary');
  }
  $('#health').className = 'health ' + h.k;
  $('#health').innerHTML = `<i></i>项目${h.t}<span class="rs">· ${esc(h.rs)}</span>`;

  const map = {projects:renderProjects, dash:renderDash, flow:renderFlow, devices:renderDevices, items:renderItems, rounds:renderRounds,
    bugs:renderBugs, matrix:renderMatrix, logs:renderLogs, weekly:renderWeekly, issues:renderIssues,
    team:renderTeam, res:renderRes, accounts:renderAccounts, vault:renderVault, report:renderReport, help:renderHelp};
  $('#view').innerHTML = (map[S.view] || renderDash)();
  if (pendingEmbed && S.view !== 'projects') {
    const bar = document.createElement('div');
    bar.className = 'recov no-print';
    bar.style.margin = '0 0 14px';
    bar.innerHTML = `<span style="font-size:15px">📥</span>
      <div>此文件内嵌了一份项目进度快照「<b>${esc((pendingEmbed.meta && pendingEmbed.meta.name) || '未命名项目')}</b>」。要把它导入为一个新项目吗？（当前各项目数据不受影响）</div>
      <span style="margin-left:auto;display:flex;gap:6px">
        <button class="btn sm primary" data-act="acceptEmbed">导入为新项目</button>
        <button class="btn sm ghost" data-act="dismissEmbed">忽略</button>
      </span>`;
    $('#view').prepend(bar);
  }
  $('#view').scrollTop = 0;
  // 顶栏项目快速切换器
  const ps = $('#projSwitch');
  if (ps) {
    ps.innerHTML = WS.list.map(p => `<option value="${p.id}" ${p.id === WS.active ? 'selected' : ''}>${esc(projNameOf(p.id))}</option>`).join('');
  }
  const vEl = $('#view');
  vEl.classList.remove('vin'); void vEl.offsetWidth; vEl.classList.add('vin');
  const last = $('#lastSave');
  if (last && !last.textContent) last.textContent = '自动保存已开启';
  bindDraft();
  const vb = $('#btnVault');
  if (vb) {
    const warnNow = !!(crashFlag || recoveredFlag || storageLow);
    vb.classList.toggle('warn', warnNow);
    vb.textContent = warnNow ? '⚠ 数据保险箱 · 需处理' : '🛡 数据保险箱 · 自动备份';
  }
}

function go(view) {
  if (wsEmpty && view !== 'projects') { toast('当前没有项目，请先新建或导入一个项目'); view = 'projects'; }
  S.view = view; save(); render();
}

function ring(pct, size) {
  size = size || 92;
  const r = size / 2 - 7, c = 2 * Math.PI * r;
  const off = c * (1 - clamp(pct, 0, 100) / 100);
  const col = pct >= 100 ? '#0f9d58' : pct > 0 ? '#2f5cf6' : '#cbd5e5';
  return `<div class="ring" style="width:${size}px;height:${size}px">
    <svg width="${size}" height="${size}">
      <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="#eef1f7" stroke-width="8"/>
      <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${col}" stroke-width="8"
        stroke-linecap="round" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}"
        style="transition:stroke-dashoffset .5s"/>
    </svg>
    <div class="rt"><b>${pct}<span style="font-size:10px;font-weight:600">%</span></b><span>完成度</span></div>
  </div>`;
}
function statusTag(st) {
  const s = STATUS[st] || STATUS.todo;
  return `<span class="tag ${s.cls}">${s.t}</span>`;
}
function sevTag(k) { return `<span class="sev ${k}">${SEVERITY[k].t}</span>`; }

/** 甘特排期图 */
function ganttHTML() {
  const r = ganttRange();
  if (!r) return `<div class="empty" style="padding:22px">尚未排期。在「测试流程」页为每个阶段设置计划起止，这里自动生成排期图。</div>`;
  const td = dayNum(today());
  const fmt = n => { const d = new Date(n * 86400000); return `${d.getMonth()+1}/${d.getDate()}`; };
  const ticks = [0, .25, .5, .75, 1].map(f => `<span>${fmt(r.min + f * r.span)}</span>`).join('');
  const rows = activeStages().map(st => {
    const d = S.stageDates[st.id] || {}, s = stageStat(st);
    let bar = `<span style="font-size:10px;color:var(--mute);padding-left:7px">未排期</span>`;
    if (d.start && d.end) {
      const a = dayNum(d.start), b2 = dayNum(d.end);
      const left = (a - r.min) / r.span * 100, w = Math.max(1.8, (b2 - a) / r.span * 100);
      const col = s.pct === 100 ? '#0f9d58' : st.tone;
      bar = `<div class="gbar" style="left:${left}%;width:${w}%;background:${col}" title="${esc(d.start)} ~ ${esc(d.end)}">${s.pct}%</div>`;
    }
    const nowLine = (td >= r.min && td <= r.max) ? `<div class="gtoday" style="left:${(td - r.min) / r.span * 100}%"></div>` : '';
    return `<div class="grow">
      <div class="gl"><span style="color:${st.tone};font-weight:750">${st.no}</span>${esc(st.name)}</div>
      <div class="gtrack">${bar}${nowLine}</div>
    </div>`;
  }).join('');
  return `<div class="gantt">
    <div class="gaxis"><div>阶段 / 排期</div><div class="ticks">${ticks}</div></div>
    ${rows}
    <div class="legend" style="margin-top:10px">
      <span><i style="background:#0f9d58"></i>已完成</span>
      <span><i style="background:#2f5cf6"></i>进行中</span>
      <span><i style="background:#dc2f2f"></i>今天</span>
    </div>
  </div>`;
}

/* =========================================================
   视图：项目总览（一级分类：项目任务）
   ========================================================= */
function renderProjects() {
  if (wsEmpty) {
    return `
    <div class="sec-title">
      <h2>项目总览</h2>
      <span class="desc">一级分类：项目任务 ｜ 当前没有任何项目</span>
      <button class="btn primary no-print" style="margin-left:auto" data-act="newProj">＋ 新建项目</button>
    </div>
    <div class="card" style="padding:34px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;text-align:center">
      <span style="font-size:34px">🗂</span>
      <div style="font-weight:750;font-size:15px">项目已全部删除</div>
      <div style="font-size:12px;color:var(--mute);line-height:1.8;max-width:520px">
        当前工作区没有任何项目。可以新建一个项目开始排期，或从「分享 / 导出」的 JSON 备份导入已有项目。
      </div>
      <div style="display:flex;gap:8px;margin-top:6px">
        <button class="btn primary" data-act="newProj">＋ 新建项目</button>
        <button class="btn" data-act="pickImport">📥 导入备份 JSON</button>
      </div>
    </div>`;
  }
  const cards = WS.list.map(p => {
    const st = projState(p.id);
    if (!st) return `<div class="card" style="padding:16px"><b>${esc(projNameOf(p.id))}</b> <span class="tag r">数据缺失</span>
      <div style="margin-top:8px"><button class="btn sm" data-act="delProj" data-id="${p.id}">删除</button></div></div>`;
    return withState(st, () => {
      const o = overall(), h = health(), b = bugStat();
      const cur = [...FRONT_CHAIN, ...PAR_TRACKS.filter(trackOn), 'report'].map(id => stageById(id)).find(x => !gateReady(x)) || stageById('report');
      const tracksOn = PAR_TRACKS.filter(trackOn);
      const iss = issuesAll().filter(x => !x.closed).length;
      const updated = o.total ? '' : '';
      return `<div class="card" style="padding:16px 18px;display:flex;flex-direction:column;gap:10px">
        <div style="display:flex;align-items:flex-start;gap:10px">
          <div style="flex:1;min-width:0">
            <div style="font-weight:750;font-size:14px;cursor:pointer" data-act="openProj" data-id="${p.id}" title="点击进入">${esc(st.meta.name || '未命名项目')}</div>
            <div style="font-size:11px;color:var(--mute);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
              ${esc(st.meta.model || '')}${st.meta.model ? ' · ' : ''}${esc(st.meta.spec || '')} · 负责人 ${esc(st.meta.owner || '—')}</div>
          </div>
          <span class="health ${h.k}"><i></i>${esc(h.t)}</span>
        </div>
        <div style="display:flex;align-items:center;gap:12px">
          ${ring(o.pct, 66)}
          <div style="flex:1;min-width:0;font-size:11.5px;color:var(--sub);line-height:1.8">
            <div>当前阶段：<b style="color:${cur.tone}">${esc(cur.no)} ${esc(cur.name)}</b></div>
            <div>测试项 ${o.done}/${o.total} · 缺陷未关闭 ${b.open}${b.crit ? `（致命/严重 ${b.crit}）` : ''}</div>
            <div>已下发任务 ${tracksOn.length} 类 · 未闭环问题 ${iss}</div>
          </div>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap" class="no-print">
          <button class="btn sm primary" data-act="openProj" data-id="${p.id}">进入项目 →</button>
          <button class="btn sm" data-act="openProjMeta" data-id="${p.id}">信息 / 重命名</button>
          <button class="btn sm ghost" data-act="delProj" data-id="${p.id}" style="margin-left:auto;color:var(--danger,#c23)">删除</button>
        </div>
      </div>`;
    });
  }).join('');

  const stats = (() => {
    let n = 0, sum = 0, risk = 0, iss = 0;
    WS.list.forEach(p => {
      const st = projState(p.id);
      if (!st) { risk++; return; }
      withState(st, () => {
        const o = overall(), h = health();
        n++; sum += o.pct;
        if (h.k === 'risk') risk++;
        iss += issuesAll().filter(x => !x.closed).length;
      });
    });
    return {n, avg: n ? Math.round(sum / n) : 0, risk, iss};
  })();

  return `
  <div class="sec-title">
    <h2>项目总览</h2>
    <span class="desc">一级分类：项目任务 ｜ 点击项目进入后，再按测试流程（S1–S5）分层管理</span>
    <button class="btn primary no-print" style="margin-left:auto" data-act="newProj">＋ 新建项目</button>
  </div>

  <div class="grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:14px">
    <div class="kpi"><div class="k">进行中项目</div><div class="v">${stats.n}</div><div class="m">彼此数据完全独立</div></div>
    <div class="kpi"><div class="k">平均整体进度</div><div class="v">${stats.avg}<small>%</small></div><div class="m">全部项目加权</div></div>
    <div class="kpi ${stats.risk ? 'alert' : 'ok'}"><div class="k">风险项目</div><div class="v">${stats.risk}</div><div class="m">阻塞或致命缺陷</div></div>
    <div class="kpi ${stats.iss ? 'alert' : 'ok'}"><div class="k">未闭环问题</div><div class="v">${stats.iss}</div><div class="m">跨项目汇总</div></div>
  </div>

  <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(320px,1fr))">
    ${cards}
    <div class="card" style="padding:16px;border:1.5px dashed var(--line2);background:transparent;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;min-height:170px;cursor:pointer" data-act="newProj">
      <span style="font-size:26px;color:var(--brand-2)">＋</span>
      <div style="font-weight:700;font-size:13px">新建项目</div>
      <div style="font-size:11.5px;color:var(--mute);text-align:center;line-height:1.6">登记项目信息与下发的任务类型<br>自动生成全套测试流程（S1–S5）</div>
    </div>
  </div>

  ${pendingEmbed ? `<div class="recov no-print" style="margin-top:14px">
    <span style="font-size:15px">📥</span>
    <div>此文件内嵌了一份项目进度快照「<b>${esc((pendingEmbed.meta && pendingEmbed.meta.name) || '未命名项目')}</b>」。要把它导入为一个新项目吗？</div>
    <span style="margin-left:auto;display:flex;gap:6px">
      <button class="btn sm primary" data-act="acceptEmbed">导入为新项目</button>
      <button class="btn sm ghost" data-act="dismissEmbed">忽略</button>
    </span>
  </div>` : ''}`;
}

function newProjectModal() {
  openModal('新建项目', `
    <div class="field"><label>项目名称 <b style="color:#c23">*</b></label><input class="inp" id="npName" placeholder="例：RID 三代天线研发 · 测试项目"></div>
    <div class="grid" style="grid-template-columns:1fr 1fr;gap:12px;margin-top:12px">
      <div class="field"><label>样机型号</label><input class="inp" id="npModel"></div>
      <div class="field"><label>规格书版本</label><input class="inp" id="npSpec" value="规格书 V1.0"></div>
      <div class="field"><label>测试负责人</label><input class="inp" id="npOwner"></div>
      <div class="field"><label>项目经理</label><input class="inp" id="npPm"></div>
    </div>
    <div class="field" style="margin-top:12px"><label>测试周期</label><input class="inp" id="npPeriod" placeholder="2026-11-01 ~ 2026-12-31"></div>
    <div class="field" style="margin-top:12px">
      <label>下发任务类型 <b style="color:#c23">*</b>（由直属领导 / 项目任务单决定）</label>
      <div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:6px">
        ${PAR_TRACKS.map(id => {
          const st = stageById(id);
          return `<label class="chk ${id === 'rd' ? 'done' : ''}" style="margin:0"><input type="checkbox" data-act="npTrack" data-id="${id}" ${id === 'rd' ? 'checked' : ''}><span>${esc(st.name)}</span></label>`;
        }).join('')}
      </div>
    </div>
    <div class="field" style="margin-top:12px"><label>下发依据</label><input class="inp" id="npTaskDoc" placeholder="任务单号 / 下发人 / 下发日期"></div>
    <div style="font-size:11.5px;color:var(--mute);margin-top:10px;line-height:1.6">一个项目通常只被下发一类任务（如只做验收测试），就只勾那一类；只有同时下发多类时才并行开展，彼此不作为门禁。创建后仍需走 S1–S3 串行前置，再执行第 4 层已下发的同级任务，最后 S5 归档。</div>
  `, `<button class="btn" data-close>取消</button><button class="btn primary" data-act="saveNewProj">创建项目</button>`);
  setTimeout(() => { const el = $('#npName'); if (el) el.focus(); }, 60);
}

/* =========================================================
   视图：总览
   ========================================================= */
function renderDash() {
  const o = overall(), b = bugStat(), h = health();
  const issAll = issuesAll(), issOpen = issAll.filter(x => !x.closed);
  const resOpen = resourceAll().filter(x => !x.closed);
  const logs = S.logs.slice().sort((a2, b2) => (b2.date||'').localeCompare(a2.date||''));
  const cur = [...FRONT_CHAIN, ...PAR_TRACKS.filter(trackOn), 'report'].map(id => stageById(id)).find(st => !gateReady(st)) || stageById('report');
  const curS = stageStat(cur), curG = stageGate(cur);

  const stageRows = activeStages().map(st => {
    const s = stageStat(st), g = stageGate(st), lock = stageLocked(st);
    const barCls = s.blocked ? 'r' : s.pct === 100 ? 'g' : '';
    return `<div style="padding:9px 0;border-bottom:1px dashed var(--line2);cursor:pointer" data-act="view" data-view="flow" data-stage="${st.id}">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px">
        <span style="font-size:10.5px;font-weight:750;color:${st.tone};width:22px">${st.no}</span>
        <span style="font-weight:600;font-size:12.5px">${st.name}</span>
        ${st.gate === '🔒' ? '<span class="tag p">🔒</span>' : st.gate === '🚦' ? '<span class="tag o">🚦</span>' : ''}
        ${lock ? '<span class="tag r">未解锁</span>' : g.done === g.total ? '<span class="tag g">准出 ✓</span>' : ''}
        <span style="margin-left:auto;font-size:11px;color:var(--mute)">${s.done}/${s.total} 项</span>
        <span style="font-size:12px;font-weight:700;width:40px;text-align:right;font-variant-numeric:tabular-nums">${s.pct}%</span>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <div class="bar ${barCls}" style="flex:1"><i style="width:${s.pct}%"></i></div>
        <span style="font-size:10.5px;color:${g.done === g.total ? 'var(--ok)' : 'var(--mute)'};width:66px;text-align:right">门禁 ${g.done}/${g.total}</span>
      </div>
    </div>`;
  }).join('');

  const recent = logs.slice(0, 4).map(l => {
    const st = stageById(l.stage);
    const its = lines(l.issues).length, bks = lines(l.blockers).length;
    return `<div style="padding:10px 0;border-bottom:1px dashed var(--line2)">
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <span style="font-weight:700;font-size:12px;font-variant-numeric:tabular-nums">${esc(l.date)}</span>
        <span class="tag m">${esc(st.name)}</span>
        ${its ? `<span class="tag r">问题 ${its}</span>` : ''}
        ${bks ? `<span class="tag o">阻碍 ${bks}</span>` : ''}
        <span style="margin-left:auto;font-size:10.5px;color:var(--mute)">${esc(l.author || '')}</span>
      </div>
      <div style="font-size:12px;color:var(--ink2);margin-top:3px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${esc(l.done || '—')}</div>
    </div>`;
  }).join('') || `<div class="empty">还没有记录。点右上角「＋ 今日记录」开始写今天的测试日志。</div>`;

  const openList = (arr, kind, limit) => (limit ? arr.slice(0, limit) : arr).map(x => `
    <div style="display:flex;gap:8px;padding:7px 0;border-bottom:1px dashed var(--line2);align-items:flex-start">
      <span class="tag ${kind === 'blocker' ? 'o' : kind === 'res' ? 'p' : 'r'}" style="margin-top:1px">${kind === 'blocker' ? '阻碍' : kind === 'res' ? '资源' : '问题'}</span>
      <div style="flex:1;min-width:0">
        <div style="font-size:12px;color:var(--ink2);word-break:break-word">${esc(x.text)}</div>
        <div style="font-size:10px;color:var(--mute);margin-top:1px">${esc(x.date)} · ${esc(stageById(x.stage).name)}</div>
      </div>
      <button class="btn sm" data-act="closeIssue" data-id="${x.id}">闭环</button>
    </div>`).join('') || `<div style="font-size:12px;color:var(--mute);padding:6px 0">暂无</div>`;

  const sevBar = (() => {
    const max = Math.max(1, ...b.bySev.map(x => x.n));
    return `<div style="display:flex;align-items:flex-end;gap:10px;height:52px;margin-top:6px">
      ${b.bySev.map(x => `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px">
        <div style="font-size:10.5px;font-weight:700;color:var(--ink)">${x.n}</div>
        <div style="width:100%;background:var(--line2);border-radius:4px;display:flex;align-items:flex-end;flex:1">
          <div style="width:100%;height:${Math.round(x.n / max * 100)}%;border-radius:4px;background:${x.k === 's1' ? '#dc2f2f' : x.k === 's2' ? '#d98012' : x.k === 's3' ? '#2f5cf6' : '#8494ac'}"></div>
        </div>
        <div style="font-size:9.5px;color:var(--mute)">${SEVERITY[x.k].t}</div>
      </div>`).join('')}
    </div>`;
  })();

  return `
  <div class="card" style="padding:13px 16px;margin-bottom:14px;display:flex;align-items:center;gap:14px;flex-wrap:wrap">
    <span class="health ${h.k}"><i></i>项目${h.t}</span>
    <span style="font-size:12.5px;color:var(--sub)">${esc(h.rs)}</span>
    <span style="width:1px;height:18px;background:var(--line)"></span>
    <span style="font-size:12.5px;color:var(--sub)">当前阶段：<b style="color:${cur.tone}">${esc(cur.no)} ${esc(cur.name)}</b>
      <span style="color:var(--mute)">（${curS.done}/${curS.total} 项 · 门禁 ${curG.done}/${curG.total}）</span></span>
    <span style="margin-left:auto;display:flex;gap:6px" class="no-print">
      <button class="btn sm" data-act="view" data-view="flow">流程门禁</button>
      <button class="btn sm" data-act="view" data-view="bugs">缺陷</button>
    </span>
  </div>

  <div class="grid" style="grid-template-columns:1.2fr 1fr 1fr 1fr;margin-bottom:14px">
    <div class="card" style="padding:14px 16px;display:flex;align-items:center;gap:14px">
      ${ring(o.pct)}
      <div style="min-width:0">
        <div style="font-size:11.5px;color:var(--sub)">整体进度</div>
        <div style="font-size:12px;color:var(--mute);margin-top:2px">${o.done}/${o.total} 项已完成</div>
        <div style="font-size:11px;margin-top:6px;display:flex;gap:5px;flex-wrap:wrap">
          ${o.blocked ? `<span class="tag r">阻塞 ${o.blocked}</span>` : '<span class="tag g">无阻塞</span>'}
          ${o.doing ? `<span class="tag b">进行 ${o.doing}</span>` : ''}
        </div>
      </div>
    </div>
    <div class="kpi">
      <div class="k">测试项执行</div>
      <div class="v">${o.done}<small>/ ${o.total}</small></div>
      <div class="bar g" style="margin:4px 0 6px"><i style="width:${o.pct}%"></i></div>
      <div class="m">待开始 ${o.todo} · 进行中 ${o.doing}</div>
    </div>
    <div class="kpi ${b.crit ? 'alert' : 'ok'}">
      <div class="k">缺陷未关闭</div>
      <div class="v">${b.open}</div>
      <div class="m" style="margin-top:auto">致命/严重 ${b.crit} · 关闭率 ${b.rate}%</div>
    </div>
    <div class="kpi ${issOpen.length ? 'alert' : 'ok'}">
      <div class="k">未闭环问题</div>
      <div class="v">${issOpen.length}</div>
      <div class="m" style="margin-top:auto">资源待协调 ${resOpen.length} 条</div>
    </div>
  </div>

  <div class="split">
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="card">
        <div class="card-h"><h3>阶段排期</h3><span class="sub">计划起止 · 在流程页维护</span>
          <div class="right"><button class="btn sm" data-act="view" data-view="flow">设置排期 →</button></div>
        </div>
        <div class="card-b">${ganttHTML()}</div>
      </div>
      <div class="card">
        <div class="card-h"><h3>阶段进度</h3><span class="sub">S1–S3 串行 → 第 4 层同级任务（已下发）→ S5 归档</span>
          <div class="right"><button class="btn sm" data-act="view" data-view="flow">打开流程 →</button></div>
        </div>
        <div class="card-b" style="padding-top:2px">${stageRows}</div>
      </div>
      <div class="card">
        <div class="card-h"><h3>最近记录</h3><span class="sub">每日进展速览</span>
          <div class="right"><button class="btn sm" data-act="view" data-view="logs">全部 →</button></div>
        </div>
        <div class="card-b" style="padding-top:2px">${recent}</div>
      </div>
    </div>

    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="card">
        <div class="card-h"><h3>门禁就绪</h3><span class="sub">${activeStages().filter(gateReady).length}/${activeStages().length} 阶段达标（未下发任务不计）</span></div>
        <div class="card-b">
          ${activeStages().map(st => {
            const g = stageGate(st), ok = g.done === g.total, lock = stageLocked(st);
            return `<div style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:12px">
              <span style="width:16px;color:${ok ? 'var(--ok)' : lock ? 'var(--bad)' : 'var(--mute)'};font-weight:700">${ok ? '✓' : lock ? '🔒' : '·'}</span>
              <span style="flex:1;color:${ok ? 'var(--ink)' : 'var(--sub)'}">${st.name}</span>
              <span style="font-size:10.5px;color:var(--mute);font-variant-numeric:tabular-nums">${g.done}/${g.total}</span>
              <div class="bar ${ok ? 'g' : ''}" style="width:46px"><i style="width:${g.pct}%"></i></div>
            </div>`;
          }).join('')}
        </div>
      </div>

      <div class="card">
        <div class="card-h"><h3>缺陷分布</h3><span class="sub">共 ${b.total} 个 · 关闭率 ${b.rate}%</span>
          <div class="right"><button class="btn sm" data-act="view" data-view="bugs">缺陷管理 →</button></div>
        </div>
        <div class="card-b">
          ${b.total ? sevBar : '<div style="font-size:12px;color:var(--mute)">暂无缺陷记录</div>'}
          ${S.bugs.filter(x => x.status !== '已关闭' && (x.sev === 's1' || x.sev === 's2')).slice(0, 3).map(x => `
            <div style="display:flex;gap:6px;align-items:center;padding:6px 0;border-top:1px dashed var(--line2);font-size:11.5px">
              ${sevTag(x.sev)}<span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(x.title)}</span>
              <span class="tag m">${esc(x.status)}</span>
            </div>`).join('')}
        </div>
      </div>

      <div class="card">
        <div class="card-h"><h3>待处理阻碍</h3>
          <div class="right"><button class="btn sm" data-act="view" data-view="issues">问题墙 →</button></div>
        </div>
        <div class="card-b" style="padding-top:2px">${openList(issAll.filter(x => x.kind === 'blocker' && !x.closed), 'blocker', 3)}</div>
      </div>

      <div class="card">
        <div class="card-h"><h3>需要的资源</h3><span class="sub">未落实</span></div>
        <div class="card-b" style="padding-top:2px">${openList(resOpen, 'res', 3)}</div>
      </div>

      <div class="card">
        <div class="card-h"><h3>最新问题</h3></div>
        <div class="card-b" style="padding-top:2px">${openList(issAll.filter(x => x.kind === 'issue' && !x.closed), 'issue', 3)}</div>
      </div>

      ${S.rounds.length ? `<div class="card">
        <div class="card-h"><h3>最新测试轮次</h3><div class="right"><button class="btn sm" data-act="view" data-view="rounds">全部 →</button></div></div>
        <div class="card-b">${S.rounds.slice(0, 2).map(r => `<div style="display:flex;gap:8px;align-items:center;padding:5px 0;font-size:12px;border-bottom:1px dashed var(--line2)">
          <b>${esc(r.version)}</b><span class="tag m">${esc(r.type)}</span>
          <span style="margin-left:auto;font-size:11px;color:var(--mute)">${esc(r.date)}</span>
        </div>`).join('')}</div>
      </div>` : ''}
    </div>
  </div>`;
}
/* =========================================================
   视图：测试流程
   ========================================================= */
function renderFlow() {
  const focus = S.flowFocus !== false;
  const cur = currentStage();
  const curStat = stageStat(cur), curGate = stageGate(cur), curLock = stageLocked(cur);
  const acts = activeStages();
  const passed = acts.filter(st => stageStat(st).pct === 100 && gateReady(st)).length;
  const pctAll = Math.round(acts.reduce((a, st) => a + stageStat(st).pct, 0) / Math.max(1, acts.length));
  const curLvl = levelOf(cur.id) + 1;

  /* ---------- 公共小工具 ---------- */
  const nextOf = st => {
    if (st.id === 'report') return '项目结项';
    if (st.id === 'pre') return 'S2 测试方案与评审门禁';
    if (st.id === 'plan') return 'S3 环境与版本准备';
    if (st.id === 'env') return '第 4 层 同级任务（' + (PAR_TRACKS.filter(trackOn).map(id => stageById(id).short).join(' / ') || '未判定') + '）';
    return 'S5 报告与归档';
  };
  const lockMsg = (st, lock) => PAR_TRACKS.includes(st.id)
    ? `第 4 层是同级任务节点，本任务只等「${lock.name}」就绪（门禁 ${stageGate(lock).done}/${stageGate(lock).total}），其余任务类型不是它的前置，先完成环境与版本准备。`
    : st.id === 'report'
      ? `「${lock.name}」门禁未通过（${stageGate(lock).done}/${stageGate(lock).total}）。全部已下发任务准出后才能归档。`
      : `上一阶段「${lock.name}」门禁未通过（${stageGate(lock).done}/${stageGate(lock).total}），按流程不应开始本阶段。`;

  /* ---------- 步骤条 ---------- */
  const arrow = '<span class="sp-arrow">›</span>';
  const stepHTML = (st, opts) => {
    const o = opts || {};
    const s = stageStat(st), g = stageGate(st), lock = stageLocked(st);
    const state = gateReady(st) ? 'done' : lock ? 'lock' : (s.pct > 0 || g.done > 0) ? 'doing' : 'todo';
    const label = gateReady(st) ? '已准出' : lock ? '未解锁' : `门禁 ${g.done}/${g.total}`;
    return `<button class="step ${state} ${st.id === cur.id ? 'now' : ''} ${o.same ? 'same' : ''}" data-act="openStage" data-id="${st.id}" title="${esc(st.name)}">
      <span class="sp-no"${o.same ? ` style="background:${st.tone}"` : ''}>${st.no}</span>
      <span class="sp-tx"><b>${esc(st.short || st.name)}</b><i>${label}</i></span>
      <span class="sp-prog"><i style="width:${s.pct}%"></i></span>
    </button>`;
  };
  const frontSteps = FRONT_CHAIN.map(id => stepHTML(stageById(id))).join(arrow);
  const trackStepChips = PAR_TRACKS.filter(trackOn).map(id => stepHTML(stageById(id), {same:true})).join('')
    || '<span class="sp-none">未判定任务类型</span>';
  const trackSteps = `<div class="sp-level">
      <div class="sp-level-t"><span class="spl-b">S4</span>同级任务节点<span class="spl-n">互不为前置</span></div>
      <div class="sp-level-c">${trackStepChips}</div>
    </div>`;

  /* ---------- 层级导航 ---------- */
  const lvlNav = LEVELS.map(l => {
    const same = l.ids.length > 1;
    const live = l.ids.filter(id => !same || trackOn(id));
    const ok = live.length > 0 && live.every(id => gateReady(stageById(id)));
    const here = l.ids.indexOf(cur.id) >= 0;
    return `<span class="ln ${ok ? 'ok' : ''} ${here ? 'here' : ''}">
      <b>${l.no}</b><i>${same ? '同级任务' : esc(l.name)}</i></span>`;
  }).join('<span class="ln-sep"></span>');

  /* ---------- 当前该做什么 ---------- */
  const openItems = curStat.total - curStat.done;
  const missGates = cur.gates.filter((_, i) => !S.gates[`${cur.id}|${i}`]);
  const cd = S.stageDates[cur.id] || {};
  let nextTxt;
  if (cur.id === 'report') nextTxt = '本项目全部收口，可交付 / 结项';
  else if (cur.id === 'env') nextTxt = '进入第 4 层同级任务：' + (PAR_TRACKS.filter(trackOn).map(id => stageById(id).name).join('、') || '尚未判定任务类型');
  else if (cur.id === 'pre') nextTxt = 'S2 测试方案与评审门禁（硬门禁）';
  else if (cur.id === 'plan') nextTxt = 'S3 环境与版本准备';
  else if (PAR_TRACKS.includes(cur.id)) nextTxt = '其余同级任务并行推进（互不为前置），全部准出后进 S5 归档';
  else nextTxt = 'S5 报告与归档（需全部已下发任务准出）';

  /* ---------- 阶段卡 ---------- */
  const nodeHTML = (st, opts) => {
    const o = Object.assign({line:true, inBranch:false}, opts || {});
    const s = stageStat(st), g = stageGate(st), lock = stageLocked(st);
    // 未手动设置时：聚焦模式下当前阶段默认展开
    const isOpen = S.open[st.id] === undefined ? (focus && st.id === cur.id) : !!S.open[st.id];
    const compact = focus && st.id !== cur.id && !isOpen;
    const cls = s.pct === 100 ? 'done' : (s.pct > 0 || s.doing) ? 'doing' : '';
    const barCls = s.blocked ? 'r' : s.pct === 100 ? 'g' : '';
    const d = S.stageDates[st.id] || {};
    const stateTag = gateReady(st) ? '<span class="tag g">已准出</span>'
      : lock ? '<span class="tag r">🔒 未解锁</span>'
      : s.pct === 100 ? '<span class="tag o">待勾门禁</span>'
      : (s.pct > 0 || g.done > 0) ? '<span class="tag b">进行中</span>' : '<span class="tag m">未开始</span>';

    /* 折叠行：非当前阶段一行摘要 */
    if (compact) {
      return `<div class="frowwrap" data-stagecard="${st.id}">
        <button class="frow ${gateReady(st) ? 'done' : ''} ${lock ? 'lock' : ''}" data-act="openStage" data-id="${st.id}">
          <span class="fr-no" style="background:${gateReady(st) ? 'var(--ok)' : st.tone}">${st.no}</span>
          <span class="fr-nm">${esc(st.name)}</span>
          <span class="fr-meta">门禁 ${g.done}/${g.total} · 任务 ${s.done}/${s.total}</span>
          <span class="fr-bar ${barCls}"><i style="width:${s.pct}%"></i></span>
          <span class="fr-pct">${s.pct}%</span>
          <span class="fr-go">展开 ›</span>
        </button>
      </div>`;
    }

    const groups = stageGroups(st).map(grp => {
      /* 设备分组：标题带设备类型色标 + 设备名，可折叠 */
      if (grp.dev) {
        const dOpen = !!(S.devUI.open && S.devUI.open[`${st.id}|${grp.devId}`]);
        const dv = grp.items.map(it => getItem(keyOf(st, it)));
        const dn = dv.filter(v => v.status === 'done').length;
        return `<div class="fsec devsec">
          <button class="sh devsh" data-act="devToggle" data-sid="${st.id}" data-dev="${grp.devId}">
            <span class="dvdot" style="background:${grp.tone}"></span>
            <span class="dvtype">${esc(grp.typeName)}</span>
            <span class="dvname">${esc(grp.name)}</span>
            <span class="shc">${dn}/${grp.items.length} 项</span>
            <span class="dvchev">${dOpen ? '▲' : '▼'}</span>
          </button>
          ${dOpen ? `<div class="devbody">${grp.items.map(it => {
            const key = keyOf(st, it), v = getItem(key);
            const bcls = v.status === 'done' ? 'g' : v.status === 'blocked' ? 'r' : v.status === 'waived' ? 'o' : '';
            return `<div class="itemrow">
              <span class="tag m" style="min-width:34px;justify-content:center">${esc(it[0])}</span>
              <span class="nm ${v.status === 'done' ? 'done' : ''}" data-act="editItem" data-key="${esc(key)}" style="cursor:pointer" title="${esc(it[3] || it[1])}">${esc(it[1])}</span>
              <select class="inp mini" style="width:78px" data-act="setStatus" data-key="${esc(key)}">
                ${Object.keys(STATUS).map(k => `<option value="${k}" ${v.status === k ? 'selected' : ''}>${STATUS[k].t}</option>`).join('')}
              </select>
              <div class="bar ${bcls}"><i style="width:${v.progress}%"></i></div>
              <span class="pv">${v.progress}%</span>
            </div>`;
          }).join('')}</div>` : ''}
        </div>`;
      }
      return `<div class="fsec">
        <div class="sh">${esc(grp.name)} <span class="shc">${grp.items.length} 项</span></div>
        ${grp.items.map(it => {
          const key = keyOf(st, it);
          const v = getItem(key);
          const bcls = v.status === 'done' ? 'g' : v.status === 'blocked' ? 'r' : v.status === 'waived' ? 'o' : '';
          return `<div class="itemrow">
            <span class="tag m" style="min-width:34px;justify-content:center">${esc(it[0])}</span>
            <span class="nm ${v.status === 'done' ? 'done' : ''}" data-act="editItem" data-key="${esc(key)}" style="cursor:pointer" title="点击填写明细 / 上传证据">${esc(it[1])}</span>
            <select class="inp mini" style="width:78px" data-act="setStatus" data-key="${esc(key)}">
              ${Object.keys(STATUS).map(k => `<option value="${k}" ${v.status === k ? 'selected' : ''}>${STATUS[k].t}</option>`).join('')}
            </select>
            <div class="bar ${bcls}"><i style="width:${v.progress}%"></i></div>
            <span class="pv">${v.progress}%</span>
          </div>`;
        }).join('')}
      </div>`;
    }).join('');

    const secH = (n, t, extra) => `<div class="fblock-h"><span class="fn">${n}</span><span class="ft2">${t}</span>${extra || ''}</div>`;

    const secEntry = `<div class="fblock">
      ${secH('1', '进入本阶段的前提', lock
        ? `<span class="fx warn">未满足 · 卡在「${esc(lock.name)}」</span>`
        : '<span class="fx ok">已满足</span>')}
      <ul class="chklist">${st.entry.map(t => `<li><i class="${lock ? 'x' : 'v'}">${lock ? '!' : '✓'}</i>${esc(t)}</li>`).join('')}</ul>
    </div>`;

    const devHint = (st.track && !devList().length)
      ? `<div class="devempty"><b>尚未登记设备</b><span>S4 的测试项按「设备类型 → 具体设备」自动生成。请先到设备库登记设备，系统会自动调用该设备类型的测试项模板。</span>
         <button class="btn sm primary" data-act="view" data-view="devices">去设备库登记</button></div>`
      : (st.track && devList().length && !stageGroups(st).some(g => g.dev))
        ? `<div class="devempty"><b>已登记设备，但对应设备类型还没有测试项模板</b><span>请在设备库为设备类型添加测试项模板，测试项会自动按设备实例化。</span>
           <button class="btn sm" data-act="view" data-view="devices">去配置模板</button></div>`
        : '';

    const secDo = `<div class="fblock">
      ${secH('2', '本阶段要做的测试项', `<span class="fx">完成 ${s.done}/${s.total}${s.blocked ? ` · <b style="color:#c62828">${s.blocked} 项阻塞</b>` : ''}</span>`)}
      ${groups}
      ${devHint}
    </div>`;

    const secSop = `<div class="fblock">
      ${secH('3', '怎么干（操作步骤）', '<span class="fx">照着做即可</span>')}
      <ol class="sop">${(st.sop || []).map(x => `<li>${esc(x)}</li>`).join('')}</ol>
    </div>`;

    const secGate = `<div class="fblock">
      ${secH('4', `什么算完成（门禁 ${g.done}/${g.total}）`, g.done === g.total
        ? '<span class="fx ok">全部满足 ✓</span>'
        : `<span class="fx warn">还差 ${g.total - g.done} 条</span>`)}
      ${st.gates.map((tx, i) => {
        const on = !!S.gates[`${st.id}|${i}`];
        return `<label class="chk ${on ? 'done' : ''}">
          <input type="checkbox" data-act="toggleGate" data-sid="${st.id}" data-idx="${i}" ${on ? 'checked' : ''}>
          <span>${esc(tx)}</span>
        </label>`;
      }).join('')}
      ${g.done !== g.total ? '<div class="gatehint">逐条落实后勾选；全部勾选即视为本阶段准出，下一环节自动解锁。</div>' : ''}
    </div>`;

    const secOut = `<div class="fblock">
      ${secH('5', '本阶段输出 / 交接物', '')}
      <div class="deliver">${(st.deliver || []).map(x => `<span class="dv">${esc(x)}</span>`).join('')}</div>
      <div class="exitbar ${g.done === g.total ? 'ok' : ''}"><b>准出</b><span>${esc(st.exit)}</span></div>
      <div class="nextstep">${gateReady(st)
        ? `<b class="ok">✓ 已准出</b> → 下一步：${esc(nextOf(st))}`
        : `<b>做完第 2、4 步即可准出</b> → 下一步：${esc(nextOf(st))}`}</div>
    </div>`;

    const lockBar = lock ? `<div class="lockbar"><b>🔒 流程锁定</b><span>${lockMsg(st, lock)}</span></div>` : '';

    const head = `<div class="fh" data-act="toggleOpen" data-id="${st.id}">
        <div style="min-width:0;flex:1">
          <div class="ft">
            <span class="fno-inline" style="background:${st.tone}">${st.no}</span>${esc(st.name)}
            ${stateTag}
            ${st.gate === '🔒' ? '<span class="tag p">🔒 独立判定</span>' : st.gate === '🚦' ? '<span class="tag o">🚦 硬门禁</span>' : ''}
            ${o.inBranch ? '<span class="tag lvl">同级节点</span>' : ''}
          </div>
          <div class="fg">${esc(st.goal)}</div>
          <div class="fmeta2">
            <span>👤 ${esc(st.role)}</span>
            <span>📅 <input class="inp mini" type="date" style="width:112px;border:none;background:transparent;padding:0 2px" value="${esc(d.start || '')}" data-act="setStageDate" data-sid="${st.id}" data-f="start"> → <input class="inp mini" type="date" style="width:112px;border:none;background:transparent;padding:0 2px" value="${esc(d.end || '')}" data-act="setStageDate" data-sid="${st.id}" data-f="end"></span>
            <span>${d.start && d.end ? `共 ${Math.round(dayNum(d.end) - dayNum(d.start))} 天` : '<i style="font-style:normal;color:var(--mute)">未排期</i>'}</span>
          </div>
        </div>
        <div class="fp">
          <span style="font-size:10.5px;color:var(--mute);white-space:nowrap">${s.done}/${s.total}项</span>
          <div class="bar ${barCls}"><i style="width:${s.pct}%"></i></div>
          <span class="pct" style="color:${s.pct === 100 ? 'var(--ok)' : 'inherit'}">${s.pct}%</span>
          <span class="chev">${isOpen ? '▲' : '▼'}</span>
        </div>
      </div>`;

    const body = isOpen ? `<div class="fb">${lockBar}${secEntry}${secDo}${secSop}${secGate}${secOut}</div>` : '';

    if (o.inBranch) {
      return `<div class="fcard fcard-branch fcard-same ${isOpen ? 'open' : ''} ${lock ? 'locked' : ''}" style="--c:${st.tone}" data-stagecard="${st.id}">${head}${body}</div>`;
    }
    return `<div class="fnode" data-stagecard="${st.id}">
      <div class="frail">
        <div class="fno ${cls}">${st.no}</div>
        ${o.line ? `<div class="fline ${s.pct === 100 ? 'done' : ''}"></div>` : ''}
      </div>
      <div class="fbody">
        <div class="fcard ${isOpen ? 'open' : ''} ${lock ? 'locked' : ''}">${head}${body}</div>
      </div>
    </div>`;
  };

  /* ---------- 任务类型判定 ---------- */
  const trackChips = PAR_TRACKS.map(id => {
    const st = stageById(id), on = trackOn(id), g = stageGate(st);
    return `<button class="trackchip ${on ? 'on' : ''}" data-act="toggleTrack" data-id="${id}" title="点击切换本项目是否下发该类任务">
      <span class="tc-dot" style="background:${on ? st.tone : 'var(--mute)'}"></span>${esc(st.name)}
      ${on ? `<span class="tc-gate">${g.done}/${g.total}</span>` : '<span class="tc-gate">未下发</span>'}
    </button>`;
  }).join('');
  const tracksOn = PAR_TRACKS.filter(trackOn);
  const tracksReady = tracksOn.filter(id => gateReady(stageById(id))).length;
  const offTracks = PAR_TRACKS.filter(id => !trackOn(id));
  const needConfirm = !(S.meta && S.meta.taskDecided) && tracksOn.length > 1;
  const verdict = tracksOn.length === 0
    ? '<b style="color:#c62828">未判定</b> —— 请按下发任务单勾选至少一类任务'
    : tracksOn.length === 1
      ? `本项目执行 <b>${esc(stageById(tracksOn[0]).name)}</b> 一类任务`
      : `本项目共 ${tracksOn.length} 类任务：<b>${tracksOn.map(id => esc(stageById(id).name)).join(' + ')}</b>（同时下发才并行，互不为门禁）`;
  const trackCards = tracksOn.length
    ? `<div class="lvlpanel">
        <div class="lvl-h">
          <span class="lvl-badge">S4</span>
          <div class="lvl-tx">
            <b>测试任务执行<span class="lvl-flag">同级节点层</span></b>
            <span>四类任务处于<b>同一层级、地位相同</b>，互不为前置；本项目已下发 ${tracksOn.length} 类，逐类推进即可</span>
          </div>
          <div class="lvl-meta"><span>门禁就绪</span><b>${tracksReady}/${tracksOn.length}</b></div>
        </div>
        <div class="lvl-rail"></div>
        <div class="lvlgrid ${tracksOn.length === 1 ? 'single' : ''}">${tracksOn.map(id => nodeHTML(stageById(id), {inBranch:true, line:false})).join('')}</div>
      </div>`
    : `<div class="fbranch-empty"><b>尚未判定任务类型</b><span>请在页面上方按下发任务单勾选——例如只下发「验收测试」，本项目就只走验收测试这一类任务。</span></div>`;
  const offStrip = offTracks.length ? `<div class="foffstrip">
      <span class="fo-t">本项目未下发</span>
      ${offTracks.map(id => { const st = stageById(id); return `<span class="fo-i" style="--c:${st.tone}">${esc(st.name)}</span>`; }).join('')}
      <span class="fo-note">不进入流程 · 不计入进度与门禁</span>
    </div>` : '';

  return `
  <div class="sec-title">
    <h2>测试流程</h2>
    <span class="desc">共 5 层：S1–S3 串行 → S4 同级任务 → S5 归档 ｜ 每层五步走：① 准入 → ② 做什么 → ③ 怎么做 → ④ 门禁 → ⑤ 输出交接</span>
    <span class="flowpct">阶段准出 <b>${passed}</b>/${acts.length} · 整体 ${pctAll}%</span>
    <button class="btn sm no-print" data-act="focusMode">${focus ? '显示全部阶段' : '只看当前阶段'}</button>
  </div>

  <div class="card stepper">
    <div class="steprow">
      ${frontSteps}${arrow}
      ${trackSteps}
      ${arrow}${stepHTML(stageById('report'))}
    </div>
    <div class="stepfoot"><div class="sbar"><i style="width:${pctAll}%"></i></div><span>整体进度 ${pctAll}%（已下发阶段测试项加权）</span></div>
  </div>

  <div class="nowcard ${curLock ? 'lock' : ''}">
    <div class="now-l">
      <span class="now-tag">你在这里 · 第 ${curLvl} 层 / 共 5 层${LEVELS[curLvl - 1].same ? ' · 同级任务节点' : ''}</span>
      <div class="now-h1"><em>${cur.no}</em>${esc(cur.name)}</div>
      <div class="now-goal">${esc(cur.goal)}</div>
      <div class="now-kv">
        <span>👤 ${esc(cur.role)}</span>
        <span>📅 ${cd.start || '未排期'}${cd.end ? ' ~ ' + cd.end : ''}</span>
      </div>
    </div>
    <div class="now-r">
      <div class="now-h2">接下来这样做</div>
      <div class="now-step"><i>1</i><div><b>推进本阶段测试项</b><span>${curStat.total === 0 ? '本阶段无测试项，直接看门禁' : openItems ? `还有 ${openItems} 项未完成（共 ${curStat.total} 项）` : '测试项已全部完成'}</span></div>
        <button class="btn sm" data-act="view" data-view="items">去台账</button></div>
      <div class="now-step"><i>2</i><div><b>落实完成标准（门禁 ${curGate.done}/${curGate.total}）</b><span>${missGates.length ? '还差：' + esc(missGates[0]).slice(0, 28) + (missGates.length > 1 ? ` 等 ${missGates.length} 条` : '') : '门禁已全部满足'}</span></div>
        <button class="btn sm" data-act="openStage" data-id="${cur.id}">去勾门禁</button></div>
      <div class="now-step"><i>3</i><div><b>准出并进入下一步</b><span>${gateReady(cur) ? '已满足准出条件' : '门禁全部勾选后'} → ${esc(nextTxt)}</span></div>
        <button class="btn sm ghost" data-act="view" data-view="logs">记今日进展</button></div>
    </div>
    <div class="now-lvlnav"><span class="nll">流程层级</span>${lvlNav}</div>
  </div>

  <div class="card taskdec ${needConfirm ? 'pending' : ''}">
    <div class="td-h">
      <b>下发任务类型判定</b>
      <span>第 4 层的四类任务同级并列，由直属领导 / 项目任务单决定本项目做哪几类——不能凭自己意愿全开</span>
    </div>
    <div class="td-chips">${trackChips}</div>
    <div class="td-foot">
      <span class="td-v">判定结果：${verdict}</span>
      <span class="td-src">下发依据
        <input class="inp mini" style="width:230px" data-act="setMeta" data-f="taskDoc" value="${esc(S.meta.taskDoc || '')}" placeholder="任务单号 / 下发人 / 下发日期">
      </span>
    </div>
    ${needConfirm ? `<div class="td-warn">⚠ 当前显示多类任务，可能来自旧版默认值。请按下发任务单核对：实际下发哪一类就只留哪一类（其余数据保留，随时可恢复）。</div>` : ''}
  </div>

  <div class="flow">
    ${FRONT_CHAIN.map(id => nodeHTML(stageById(id))).join('')}
    ${trackCards}
    ${offStrip}
    <div class="fmerge"><span>${tracksOn.length > 1 ? '第 4 层已下发任务全部准出后汇入 S5' : '第 4 层本任务准出后汇入 S5'}</span><i></i></div>
    ${nodeHTML(stageById('report'), {line:false})}
  </div>`;
}

/* =========================================================
   视图：设备库（S4 同级任务层下的二级分类）
   设备类型（可增删改查） → 具体设备（可增删改查） → 该类型的测试项模板（可增删改查）
   ========================================================= */
function devTypeModal(t) {
  const e = t || {};
  openModal(t ? '编辑设备类型' : '新增设备类型', `
    <div class="grid" style="grid-template-columns:1fr 1fr;gap:12px">
      <div class="field"><label>设备类型名称</label><input class="inp" id="dtName" value="${esc(e.name || '')}" placeholder="如：纯侦测类设备"></div>
      <div class="field"><label>标识色</label><input class="inp" type="color" id="dtTone" value="${esc(e.tone || '#2f5cf6')}" style="height:34px;padding:2px"></div>
    </div>
    <div class="field" style="margin-top:12px"><label>说明</label>
      <input class="inp" id="dtNote" value="${esc(e.note || '')}" placeholder="该类设备的能力范围，例如：仅具备侦察/探测能力"></div>
    <div style="margin-top:12px;font-size:11.5px;color:var(--mute)">新增类型会自动带出一套空白模板，可在下方「测试项模板」中添加测试项。</div>
  `, `<button class="btn" data-close>取消</button>
      <button class="btn primary" data-act="saveDevType" data-id="${esc(e.id || '')}">保存</button>`);
}
function devModal(d) {
  const e = d || {};
  openModal(d ? '编辑设备' : '新增设备', `
    <div class="grid" style="grid-template-columns:1fr 1fr;gap:12px">
      <div class="field"><label>设备名称</label><input class="inp" id="dvName" value="${esc(e.name || '')}" placeholder="如：XX 型侦测设备"></div>
      <div class="field"><label>型号 / 编号</label><input class="inp" id="dvModel" value="${esc(e.model || '')}" placeholder="如：ZD-100 / 样机 01#"></div>
    </div>
    <div class="field" style="margin-top:12px"><label>所属设备类型</label>
      <select class="inp" id="dvType">
        ${devTypes().map(t => `<option value="${t.id}" ${(e.tid || S.devUI.curTid) === t.id ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}
      </select></div>
    <div class="field" style="margin-top:12px"><label>备注</label>
      <input class="inp" id="dvNote" value="${esc(e.note || '')}" placeholder="配置、状态、责任人等"></div>
  `, `<button class="btn" data-close>取消</button>
      <button class="btn primary" data-act="saveDev" data-id="${esc(e.id || '')}">保存</button>`);
}
function tplModal(tid, t) {
  const e = t || {};
  openModal(t ? '编辑测试项' : '新增测试项', `
    <div class="grid" style="grid-template-columns:1fr 1fr;gap:12px">
      <div class="field"><label>分类</label><input class="inp" id="tpCat" value="${esc(e.cat || '')}" placeholder="侦测 / 打击 / 诱骗 / 联动 / 安全 / 环境 / 软件…"></div>
      <div class="field"><label>测试项名称</label><input class="inp" id="tpName" value="${esc(e.name || '')}" placeholder="如：侦测灵敏度"></div>
    </div>
    <div class="field" style="margin-top:12px"><label>判定标准 / 测试方法</label>
      <input class="inp" id="tpStd" value="${esc(e.std || '')}" placeholder="如：≤ -95 dBm，按规格书门限稳定告警"></div>
    <div style="margin-top:12px;font-size:11.5px;color:var(--mute)">属于「${esc(devTypeName(tid))}」的模板；保存后，该类下的每一台设备都会自动生成这一条测试项。</div>
  `, `<button class="btn" data-close>取消</button>
      <button class="btn primary" data-act="saveTpl" data-tid="${esc(tid)}" data-id="${esc(e.id || '')}">保存</button>`);
}
function renderDevices() {
  const types = devTypes();
  if (!types.length) {
    return `<div class="sec-title"><h2>设备库</h2><span class="desc">S4 同级任务层下的二级分类</span></div>
      <div class="card"><div class="card-b">
        <div class="devempty" style="border:none;background:none;padding:6px 0">
          <b>还没有任何设备类型</b><span>先新增设备类型（如纯侦测类设备 / 纯打击设备 / 侦测打击诱骗一体设备），再登记设备与测试项模板。</span>
          <button class="btn sm primary" data-act="devTypeAdd">＋ 新增设备类型</button>
        </div>
      </div></div>`;
  }
  const cur = devTypeById(S.devUI.curTid) || types[0];
  const devs = devList().filter(d => d.tid === cur.id);
  const tpl = devTplOf(cur.id);
  const tracksOn = PAR_TRACKS.filter(trackOn);
  const instTotal = devs.length * tpl.length * Math.max(1, tracksOn.length);

  const typeCards = types.map(t => {
    const n = devList().filter(d => d.tid === t.id).length;
    const m = devTplOf(t.id).length;
    return `<div class="dtcard ${t.id === cur.id ? 'on' : ''}" style="--c:${t.tone}" data-act="devPickType" data-id="${t.id}">
      <div class="dt-top"><span class="dt-dot"></span><b>${esc(t.name)}</b>
        <span class="dt-btns">
          <button class="btn sm ghost no-print" data-act="devTypeEdit" data-id="${t.id}">改</button>
          <button class="btn sm ghost no-print" data-act="devTypeDel" data-id="${t.id}">删</button>
        </span>
      </div>
      <div class="dt-note">${esc(t.note || '—')}</div>
      <div class="dt-meta"><span>设备 <b>${n}</b></span><span>模板测试项 <b>${m}</b></span></div>
    </div>`;
  }).join('');

  const devRows = devs.length ? `
    <div class="tblwrap"><table class="tbl">
      <tr><th>设备名称</th><th style="width:150px">型号 / 编号</th><th>备注</th><th style="width:100px">生成测试项</th><th style="width:120px">操作</th></tr>
      ${devs.map(d => `<tr>
        <td class="name"><span class="dvdot" style="background:${cur.tone}"></span>${esc(d.name)}</td>
        <td>${esc(d.model || '—')}</td>
        <td style="color:var(--sub)">${esc(d.note || '—')}</td>
        <td>${tpl.length * Math.max(1, tracksOn.length)} 项</td>
        <td><button class="btn sm" data-act="devEdit" data-id="${d.id}">编辑</button>
            <button class="btn sm ghost" data-act="devDel" data-id="${d.id}">删除</button></td>
      </tr>`).join('')}
    </table></div>`
    : `<div class="devempty"><b>该类型下还没有设备</b><span>登记具体设备后，S4 各任务线会自动按模板生成该设备的测试项。</span></div>`;

  const tplRows = tpl.length ? `
    <div class="tblwrap"><table class="tbl">
      <tr><th style="width:52px">序号</th><th style="width:110px">分类</th><th>测试项</th><th>判定标准 / 测试方法</th><th style="width:150px">操作</th></tr>
      ${tpl.map((x, i) => `<tr>
        <td style="color:var(--mute)">${i + 1}</td>
        <td><span class="tag m">${esc(x.cat || '—')}</span></td>
        <td class="name">${esc(x.name)}</td>
        <td style="color:var(--sub)">${esc(x.std || '—')}</td>
        <td>
          <button class="btn sm ghost" data-act="tplUp" data-tid="${cur.id}" data-id="${x.id}" ${i === 0 ? 'disabled' : ''}>↑</button>
          <button class="btn sm ghost" data-act="tplDown" data-tid="${cur.id}" data-id="${x.id}" ${i === tpl.length - 1 ? 'disabled' : ''}>↓</button>
          <button class="btn sm" data-act="tplEdit" data-tid="${cur.id}" data-id="${x.id}">编辑</button>
          <button class="btn sm ghost" data-act="tplDel" data-tid="${cur.id}" data-id="${x.id}">删除</button>
        </td>
      </tr>`).join('')}
    </table></div>`
    : `<div class="devempty"><b>该类型还没有测试项模板</b><span>添加测试项后，该类型下每台设备都会自动实例化这些测试项。</span></div>`;

  return `
  <div class="sec-title">
    <h2>设备库 · S4 二级分类</h2>
    <span class="desc">设备类型 → 具体设备 → 按设备类型自动调用测试项模板；三者均可自定义增删改查</span>
    <button class="btn sm primary no-print" data-act="devTypeAdd">＋ 新增设备类型</button>
  </div>

  <div class="devtypes">${typeCards}</div>

  <div class="card" style="margin-top:12px">
    <div class="card-h">
      <h3><span class="dvdot" style="background:${cur.tone}"></span>${esc(cur.name)} · 具体设备</h3>
      <span class="sub">${devs.length} 台</span>
      <div class="right"><button class="btn sm primary" data-act="devAdd">＋ 新增设备</button></div>
    </div>
    <div class="card-b" style="padding-top:2px">${devRows}</div>
  </div>

  <div class="card" style="margin-top:12px">
    <div class="card-h">
      <h3><span class="dvdot" style="background:${cur.tone}"></span>${esc(cur.name)} · 测试项模板（模块化）</h3>
      <span class="sub">${tpl.length} 项 · 当前共实例化 ${instTotal} 条测试项</span>
      <div class="right">
        <button class="btn sm" data-act="tplCopy" data-tid="${cur.id}">从其他类型复制</button>
        <button class="btn sm ghost" data-act="tplClear" data-tid="${cur.id}">清空</button>
        <button class="btn sm primary" data-act="tplAdd" data-tid="${cur.id}">＋ 新增测试项</button>
      </div>
    </div>
    <div class="card-b" style="padding-top:2px">${tplRows}</div>
  </div>

  <div class="card" style="margin-top:12px">
    <div class="card-h"><h3>调用规则</h3></div>
    <div class="card-b" style="font-size:12.5px;color:var(--ink2);line-height:1.9">
      · <b>二级分类</b>：S4（同级任务层）下先按<b>设备类型</b>分类，再按<b>具体设备</b>展开；不同类型互不影响。<br>
      · <b>模板调用</b>：测试项写在「设备类型」上——同一类型下的每台设备都会自动生成同一套测试项，进度按设备独立记录。<br>
      · <b>生效范围</b>：已下发的任务线（${tracksOn.map(id => esc(stageById(id).name)).join(' / ') || '未判定'}）中都会出现这些设备测试项，并计入阶段进度、台账、指标追溯与报告。<br>
      · <b>调整安全</b>：删除设备 / 测试项会同时清理其进度数据；删除设备类型会连带删除其下设备与模板。
    </div>
  </div>`;
}

/* =========================================================
   视图：测试项台账
   ========================================================= */
function renderItems() {
  const f = S.filter;
  const q = (f.q || '').toLowerCase();
  const rows = [];
  STAGES.forEach(st => {
    if (!stageActive(st)) return;
    if (f.stage !== 'all' && f.stage !== st.id) return;
    const sub = [];
    stageGroups(st).forEach(g => g.items.forEach(it => {
      const key = keyOf(st, it);
      const v = getItem(key);
      if (f.status === 'open' && (v.status === 'done' || v.status === 'waived')) return;
      if (f.status === 'blocked' && v.status !== 'blocked') return;
      if (f.status === 'done' && v.status !== 'done') return;
      if (q && !(it[1].toLowerCase().includes(q) || (v.owner || '').toLowerCase().includes(q) || (v.note || '').toLowerCase().includes(q))) return;
      sub.push({g:g.name, it, key, v, dev:g.dev ? {name:g.name, type:g.typeName, tone:g.tone} : null});
    }));
    if (sub.length) rows.push({st, sub});
  });
  const count = rows.reduce((a, r) => a + r.sub.length, 0);

  const pills = [{id:'all', t:'全部'}].concat(activeStages().map(s => ({id:s.id, t:s.no + ' ' + s.name})));
  const body = rows.map(r => {
    const st = r.st;
    return `<tr class="grp"><td colspan="8">${st.no} · ${esc(st.name)} <span style="font-weight:400;color:var(--mute)">（${r.sub.length} 项 · 门禁 ${stageGate(st).done}/${stageGate(st).total}）</span></td></tr>` +
      r.sub.map(x => {
        const v = x.v;
        const bcls = v.status === 'done' ? 'g' : v.status === 'blocked' ? 'r' : v.status === 'waived' ? 'o' : '';
        return `<tr data-key="${esc(x.key)}">
          <td class="name">
            <div style="display:flex;align-items:center;gap:6px">
              <span class="tag m" style="flex:0 0 auto">${esc(x.it[0])}</span>
              <span style="cursor:pointer" data-act="editItem" data-key="${esc(x.key)}">${esc(x.it[1])}</span>
              ${x.g.includes('外场') ? '<span class="tag" style="background:#eef7ff;color:#0b6ba8">外场</span>' : ''}
              ${x.dev ? `<span class="tag" style="background:${x.dev.tone}1a;color:${x.dev.tone}" title="设备类型：${esc(x.dev.type)}">🔧 ${esc(x.dev.name)}</span>` : ''}
            </div>
            ${v.note ? `<div class="note">${esc(v.note).slice(0, 60)}</div>` : ''}
          </td>
          <td><input class="inp mini" style="width:78px" placeholder="—" value="${esc(v.owner)}" data-act="setField" data-key="${esc(x.key)}" data-f="owner"></td>
          <td><select class="inp mini" style="width:84px" data-act="setStatus" data-key="${esc(x.key)}">
            ${Object.keys(STATUS).map(k => `<option value="${k}" ${v.status === k ? 'selected' : ''}>${STATUS[k].t}</option>`).join('')}
          </select></td>
          <td>
            <div style="display:flex;align-items:center;gap:5px">
              <input type="number" min="0" max="100" step="5" class="inp mini" style="width:52px" value="${v.progress}" data-act="setProgress" data-key="${esc(x.key)}">
              <div class="bar ${bcls}" style="width:42px"><i style="width:${v.progress}%"></i></div>
            </div>
          </td>
          <td><input class="inp mini" type="date" style="width:118px" value="${esc(v.plan)}" data-act="setField" data-key="${esc(x.key)}" data-f="plan"></td>
          <td><input class="inp mini" type="date" style="width:118px" value="${esc(v.actual)}" data-act="setField" data-key="${esc(x.key)}" data-f="actual"></td>
          <td><select class="inp mini" style="width:92px" data-act="setResult" data-key="${esc(x.key)}">
            ${RESULTS.map(r2 => `<option value="${r2}" ${v.result === r2 ? 'selected' : ''}>${r2 || '—'}</option>`).join('')}
          </select></td>
          <td><button class="btn sm" data-act="editItem" data-key="${esc(x.key)}">明细</button></td>
        </tr>`;
      }).join('');
  }).join('');

  return `
  <div class="sec-title">
    <h2>测试项台账</h2>
    <span class="desc">全量 ${allItems().length} 项 · 当前显示 ${count} 项 · 状态/进度可直接改</span>
    <button class="btn sm primary no-print" style="margin-left:auto" data-act="exportCsv">导出 CSV</button>
  </div>

  <div class="card" style="margin-bottom:12px">
    <div class="card-b" style="padding:11px 14px">
      <div class="filters">
        <input class="inp" style="width:190px" placeholder="搜索测试项 / 负责人 / 备注" value="${esc(f.q)}" data-act="filterQ">
        <select class="inp" style="width:150px" data-act="filterStatus">
          <option value="all" ${f.status === 'all' ? 'selected' : ''}>全部状态</option>
          <option value="open" ${f.status === 'open' ? 'selected' : ''}>仅未完成</option>
          <option value="blocked" ${f.status === 'blocked' ? 'selected' : ''}>仅阻塞</option>
          <option value="done" ${f.status === 'done' ? 'selected' : ''}>仅完成</option>
        </select>
        <div class="pills" style="flex:1">
          ${pills.map(p => `<button class="pill ${f.stage === p.id ? 'on' : ''}" data-act="filterStage" data-id="${p.id}">${esc(p.t)}</button>`).join('')}
        </div>
      </div>
    </div>
  </div>

  <div class="card" style="overflow:hidden">
    <table class="tbl">
      <thead><tr>
        <th style="min-width:250px">测试项</th><th>负责人</th><th>状态</th><th style="min-width:110px">进度</th>
        <th>计划完成</th><th>实际完成</th><th>结果</th><th></th>
      </tr></thead>
      <tbody>${body || `<tr><td colspan="8"><div class="empty">没有匹配的测试项，换个筛选条件试试。</div></td></tr>`}</tbody>
    </table>
  </div>`;
}

function editItemModal(key) {
  let head = '';
  if (key.indexOf('dev|') === 0) {
    const [, sid, devId, tplId] = key.split('|');
    const st0 = stageById(sid), d = devById(devId);
    const t = d ? devTplOf(d.tid).find(x => x.id === tplId) : null;
    head = `<span class="tag b">${esc(st0.no)} ${esc(st0.name)}</span>
      <span class="tag m">${esc(d ? devTypeName(d.tid) : '设备')}</span>
      <span class="tag" style="background:${devTone(d && d.tid)}1a;color:${devTone(d && d.tid)}">🔧 ${esc(d ? d.name : '—')}</span>
      ${t && t.std ? `<div style="width:100%;font-size:11.5px;color:var(--sub);line-height:1.6">判定标准 / 方法：${esc(t.std)}</div>` : ''}`;
  } else {
    const [sid, cat] = key.split('|');
    const st0 = stageById(sid);
    head = `<span class="tag b">${esc(st0.no)} ${esc(st0.name)}</span><span class="tag m">${esc(cat)}</span>`;
  }
  const v = getItem(key);
  openModal(itemLabel(key), `
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px">
      ${head}
      ${statusTag(v.status)}
    </div>
    <div class="grid" style="grid-template-columns:1fr 1fr;gap:12px">
      <div class="field"><label>负责人</label><input class="inp" id="mOwner" value="${esc(v.owner)}" placeholder="姓名"></div>
      <div class="field"><label>状态</label><select class="inp" id="mStatus">
        ${Object.keys(STATUS).map(k => `<option value="${k}" ${v.status === k ? 'selected' : ''}>${STATUS[k].t}</option>`).join('')}
      </select></div>
      <div class="field"><label>进度 (%)</label><input class="inp" type="number" min="0" max="100" step="5" id="mProgress" value="${v.progress}"></div>
      <div class="field"><label>判定结果</label><select class="inp" id="mResult">
        ${RESULTS.map(r => `<option value="${r}" ${v.result === r ? 'selected' : ''}>${r || '未出结论'}</option>`).join('')}
      </select></div>
      <div class="field"><label>计划完成</label><input class="inp" type="date" id="mPlan" value="${esc(v.plan)}"></div>
      <div class="field"><label>实际完成</label><input class="inp" type="date" id="mActual" value="${esc(v.actual)}"></div>
    </div>
    <div class="field" style="margin-top:12px"><label>证据 / 数据位置</label>
      <input class="inp" id="mEvidence" value="${esc(v.evidence)}" placeholder="原始数据目录、截图/录像编号、仪器记录文件"></div>
    <div class="field" style="margin-top:12px">
      <label>附件证据 <span style="font-weight:400;color:var(--mute)">（支持 PDF / Word / Excel / PPT / 图片 / 音视频 / 压缩包等，单个 ≤ 50MB）</span></label>
      <div id="attBox" style="margin-top:6px"><span style="font-size:12px;color:var(--mute)">加载中…</span></div>
      <label class="btn sm" style="margin-top:8px;cursor:pointer;justify-content:center">＋ 添加附件（可多选）
        <input type="file" multiple style="display:none" data-act="addFiles" data-key="${esc(key)}">
      </label>
      <div style="font-size:11px;color:var(--mute);margin-top:5px">附件保存在本机浏览器（IndexedDB），不随 JSON 备份/分享文件走；重要附件请同时保留源文件并把路径填到「证据 / 数据位置」。</div>
    </div>
    <div class="field" style="margin-top:12px"><label>备注 / 结论说明</label>
      <textarea class="inp" id="mNote" placeholder="异常现象、偏差说明、豁免理由…">${esc(v.note)}</textarea></div>
    <div style="margin-top:12px;font-size:11.5px;color:var(--mute)">阶段准出：${esc(st0.exit)}</div>
  `, `<button class="btn" data-close>取消</button><button class="btn primary" data-act="saveItem" data-key="${esc(key)}">保存</button>`);
  loadAttachments(key);
}

/* =========================================================
   视图：指标-测试项-结果追溯矩阵
   ========================================================= */
function renderMatrix() {
  const opts = allItems();
  const rows = S.matrix.map(m => {
    const it = opts.find(i => i.key === m.itemKey);
    const v = m.itemKey ? getItem(m.itemKey) : null;
    const ok = v && v.result === '通过';
    return `<tr>
      <td><input class="inp mini" style="width:130px;font-weight:600" value="${esc(m.metric)}" data-act="mField" data-id="${m.id}" data-f="metric"></td>
      <td><input class="inp mini" style="width:150px" value="${esc(m.spec)}" data-act="mField" data-id="${m.id}" data-f="spec"></td>
      <td><select class="inp mini" style="width:180px" data-act="mField" data-id="${m.id}" data-f="itemKey">
        <option value="">— 未关联 —</option>
        ${opts.map(i => `<option value="${esc(i.key)}" ${m.itemKey === i.key ? 'selected' : ''}>${esc(i.stage.no)} / ${i.dev ? esc(i.dev.name) + ' / ' : ''}${esc(i.cat)} / ${esc(i.name)}</option>`).join('')}
      </select></td>
      <td><input class="inp mini" style="width:130px" value="${esc(m.method)}" data-act="mField" data-id="${m.id}" data-f="method" placeholder="测试方法与条件"></td>
      <td style="text-align:center">${v ? `<span class="tag ${v.result === '通过' ? 'g' : v.result === '不通过' ? 'r' : v.result ? 'o' : 'm'}">${esc(v.result || '未判定')}</span>` : '<span class="tag m">—</span>'}</td>
      <td><input class="inp mini" style="width:150px" value="${esc(m.evidence)}" data-act="mField" data-id="${m.id}" data-f="evidence" placeholder="记录编号 / 路径"></td>
      <td><select class="inp mini" style="width:96px" data-act="mField" data-id="${m.id}" data-f="conclusion">
        ${RESULTS.map(r => `<option value="${r}" ${m.conclusion === r ? 'selected' : ''}>${r || '—'}</option>`).join('')}
      </select></td>
      <td><button class="btn sm ghost" data-act="delMatrix" data-id="${m.id}">×</button></td>
    </tr>`;
  }).join('');

  const covered = S.matrix.filter(m => m.itemKey && m.conclusion).length;

  return `
  <div class="sec-title">
    <h2>指标追溯矩阵</h2>
    <span class="desc">指标 → 测试项 → 结果 → 证据，验收判定与偏差审批的依据</span>
    <button class="btn sm primary no-print" style="margin-left:auto" data-act="addMatrix">＋ 新增指标</button>
  </div>

  <div class="grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:14px">
    <div class="kpi"><div class="k">受控指标</div><div class="v">${S.matrix.length}</div><div class="m">来自规格书与需求</div></div>
    <div class="kpi ${covered < S.matrix.length ? 'alert' : 'ok'}"><div class="k">已出结论</div><div class="v">${covered}</div><div class="m">关联测试项并判定</div></div>
    <div class="kpi"><div class="k">未关联测试项</div><div class="v">${S.matrix.filter(m => !m.itemKey).length}</div><div class="m">存在不可追溯风险</div></div>
    <div class="kpi ${S.matrix.filter(m => !m.evidence).length ? 'alert' : 'ok'}"><div class="k">缺证据</div><div class="v">${S.matrix.filter(m => !m.evidence).length}</div><div class="m">验收时需补齐</div></div>
  </div>

  <div class="card" style="overflow:auto">
    <table class="tbl">
      <thead><tr>
        <th>指标名称</th><th>规格要求</th><th>关联测试项</th><th>测试方法</th>
        <th style="text-align:center">台账结果</th><th>原始证据</th><th>判定结论</th><th></th>
      </tr></thead>
      <tbody>${rows || `<tr><td colspan="8"><div class="empty">还没有指标行，点右上角新增。</div></td></tr>`}</tbody>
    </table>
  </div>
  <div style="font-size:11.5px;color:var(--mute);margin-top:10px;line-height:1.7">
    说明：「台账结果」自动取自测试项台账中的判定结果，不可在此直接修改；如判定与台账不一致，需在「争议复核与偏差审批」中书面说明。
  </div>`;
}
/* =========================================================
   视图：版本轮次
   ========================================================= */
function roundFields(r) {
  r = r || {};
  return `
  <div class="grid" style="grid-template-columns:1fr 1fr;gap:12px">
    <div class="field"><label>版本号</label><input class="inp" id="rVer" value="${esc(r.version || '')}" placeholder="V2.3.1"></div>
    <div class="field"><label>构建日期</label><input class="inp" type="date" id="rDate" value="${esc(r.date || today())}"></div>
    <div class="field"><label>轮次类型</label><select class="inp" id="rType">
      ${ROUND_TYPES.map(t => `<option value="${t}" ${(r.type || ROUND_TYPES[0]) === t ? 'selected' : ''}>${t}</option>`).join('')}
    </select></div>
    <div class="field"><label>负责人</label><input class="inp" id="rOwner" value="${esc(r.owner || S.meta.owner || '')}"></div>
  </div>
  <div class="field" style="margin-top:12px"><label>版本变更内容</label>
    <textarea class="inp" id="rScope" placeholder="新增/修改/修复了什么">${esc(r.scope || '')}</textarea></div>
  <div class="field" style="margin-top:12px"><label>本轮回归范围</label>
    <textarea class="inp" id="rRegress" placeholder="按变更影响确定的回归项，如：灵敏度、功率、导航干扰">${esc(r.regress || '')}</textarea></div>
  <div class="field" style="margin-top:12px"><label>轮次结论</label><select class="inp" id="rConcl">
    ${['', '通过', '有条件通过', '不通过（打回研发）'].map(c => `<option value="${c}" ${(r.conclusion || '') === c ? 'selected' : ''}>${c || '未出结论'}</option>`).join('')}
  </select></div>
  <div class="field" style="margin-top:12px"><label>备注</label><input class="inp" id="rNote" value="${esc(r.note || '')}" placeholder="冒烟情况、遗留问题"></div>`;
}

function renderRounds() {
  const rs = S.rounds.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const last = rs[0];
  const cards = rs.map(r => {
    const cc = r.conclusion === '通过' ? 'g' : r.conclusion === '不通过（打回研发）' ? 'r' : r.conclusion ? 'o' : 'm';
    const bugs = S.bugs.filter(b => b.version === r.version).length;
    return `<div class="round">
      <div style="flex:0 0 auto;min-width:96px">
        <div class="rv">${esc(r.version)}</div>
        <div class="rm">${esc(r.date)}</div>
        <div class="pillrow"><span class="tag m">${esc(r.type)}</span></div>
      </div>
      <div class="rb">
        ${r.scope ? `<div><b style="color:var(--sub);font-weight:600">变更：</b>${esc(r.scope)}</div>` : ''}
        ${r.regress ? `<div><b style="color:var(--sub);font-weight:600">回归：</b>${esc(r.regress)}</div>` : ''}
        ${r.note ? `<div style="color:var(--mute)">${esc(r.note)}</div>` : ''}
        <div class="pillrow">
          <span class="tag m">负责人 ${esc(r.owner || '—')}</span>
          <span class="tag ${bugs ? 'r' : 'm'}">关联缺陷 ${bugs}</span>
        </div>
      </div>
      <div class="ra">
        <span class="tag ${cc}">${esc(r.conclusion || '未出结论')}</span>
        <span style="display:flex;gap:4px;margin-top:4px" class="no-print">
          <button class="btn sm ghost" data-act="editRound" data-id="${r.id}">编辑</button>
          <button class="btn sm ghost" data-act="delRound" data-id="${r.id}">删除</button>
        </span>
      </div>
    </div>`;
  }).join('');

  return `
  <div class="sec-title">
    <h2>版本轮次</h2>
    <span class="desc">每一轮构建测了什么、回归到什么范围、结论如何——发布追溯的依据</span>
    <button class="btn sm primary no-print" style="margin-left:auto" data-act="addRound">＋ 新增轮次</button>
  </div>

  <div class="grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:14px">
    <div class="kpi"><div class="k">测试轮次</div><div class="v">${rs.length}</div><div class="m">涵盖研发/迭代/验收</div></div>
    <div class="kpi"><div class="k">当前版本</div><div class="v" style="font-size:19px">${esc(last ? last.version : '—')}</div><div class="m">${esc(last ? last.date : '尚无轮次')}</div></div>
    <div class="kpi ${rs.filter(r => !r.conclusion).length ? 'alert' : 'ok'}"><div class="k">未出结论</div><div class="v">${rs.filter(r => !r.conclusion).length}</div><div class="m">轮次需闭环结论</div></div>
  </div>

  ${cards || `<div class="card"><div class="empty">还没有版本轮次。每拿到一个新构建版本就登记一轮，方便日后追溯"哪版改了什么、测了什么"。</div></div>`}`;
}

/* =========================================================
   视图：缺陷管理
   ========================================================= */
function bugFields(b) {
  b = b || {};
  return `
  <div class="field"><label>缺陷标题</label><input class="inp" id="bTitle" value="${esc(b.title || '')}" placeholder="例：2.4G 频段灵敏度低于指标 3dB"></div>
  <div class="grid" style="grid-template-columns:1fr 1fr;gap:12px;margin-top:12px">
    <div class="field"><label>严重等级</label><select class="inp" id="bSev">
      ${Object.keys(SEVERITY).map(k => `<option value="${k}" ${(b.sev || 's3') === k ? 'selected' : ''}>${SEVERITY[k].t}${k === 's1' ? '（阻断，必须修复）' : k === 's2' ? '（影响主要指标）' : ''}</option>`).join('')}
    </select></div>
    <div class="field"><label>处理状态</label><select class="inp" id="bStatus">
      ${BUG_STATUS.map(s => `<option value="${s}" ${(b.status || '新建') === s ? 'selected' : ''}>${s}</option>`).join('')}
    </select></div>
    <div class="field"><label>所属模块 / 阶段</label><select class="inp" id="bStage">
      ${activeStages().map(s => `<option value="${s.id}" ${(b.stage || 'rd') === s.id ? 'selected' : ''}>${s.no} ${esc(s.name)}</option>`).join('')}
    </select></div>
    <div class="field"><label>责任人</label><input class="inp" id="bOwner" value="${esc(b.owner || '')}" placeholder="研发/测试"></div>
    <div class="field"><label>发现版本</label><input class="inp" id="bVersion" value="${esc(b.version || '')}" placeholder="V2.3.1"></div>
    <div class="field"><label>发现日期</label><input class="inp" type="date" id="bFound" value="${esc(b.found || today())}"></div>
    <div class="field"><label>要求关闭日期</label><input class="inp" type="date" id="bDue" value="${esc(b.due || '')}"></div>
    <div class="field"><label>缺陷编号</label><input class="inp" id="bNo" value="${esc(b.no || '')}" placeholder="留空自动生成"></div>
  </div>
  <div class="field" style="margin-top:12px"><label>现象 / 复现步骤 / 处理说明</label>
    <textarea class="inp" id="bNote" placeholder="复现条件、实测值、期望值…">${esc(b.note || '')}</textarea></div>`;
}

function renderBugs() {
  const b = bugStat(), f = S.bugFilter;
  const q = (f.q || '').toLowerCase();
  const filtered = S.bugs.filter(x =>
    (f.sev === 'all' || x.sev === f.sev) &&
    (f.status === 'all' || x.status === f.status) &&
    (!q || (x.title || '').toLowerCase().includes(q) || (x.owner || '').toLowerCase().includes(q) || (x.no || '').toLowerCase().includes(q)));

  const kanban = BUG_STATUS.map(st => {
    const list = filtered.filter(x => x.status === st);
    return `<div class="kcol" data-col="${esc(st)}">
      <h4>${esc(st)}<span class="n">${list.length}</span></h4>
      ${list.length ? list.map(x => `<div class="kcard" draggable="true" data-bug="${x.id}" data-act="editBug" data-id="${x.id}">
        <div class="t">${esc(x.title)}</div>
        <div class="m">
          ${sevTag(x.sev)}
          <span>${esc(x.no)}</span>
          ${x.version ? `<span>· ${esc(x.version)}</span>` : ''}
          ${x.owner ? `<span>· ${esc(x.owner)}</span>` : ''}
        </div>
      </div>`).join('') : '<div class="kempty">—</div>'}
    </div>`;
  }).join('');

  const rows = filtered.map(x => `<tr>
    <td style="font-weight:700;white-space:nowrap">${esc(x.no)}</td>
    <td class="name">${esc(x.title)}</td>
    <td>${sevTag(x.sev)}</td>
    <td><select class="inp mini" style="width:88px" data-act="setBugStatus" data-id="${x.id}">
      ${BUG_STATUS.map(s => `<option value="${s}" ${x.status === s ? 'selected' : ''}>${s}</option>`).join('')}
    </select></td>
    <td><input class="inp mini" style="width:74px" value="${esc(x.owner || '')}" data-act="setBugField" data-id="${x.id}" data-f="owner"></td>
    <td style="font-size:11px;color:var(--sub)">${esc(stageById(x.stage).no)}</td>
    <td style="white-space:nowrap;font-size:11px">${esc(x.version || '—')}</td>
    <td style="white-space:nowrap;font-size:11px">${esc(x.found || '—')}</td>
    <td style="white-space:nowrap;font-size:11px;color:${x.due && dayNum(x.due) < dayNum(today()) && x.status !== '已关闭' ? 'var(--bad)' : 'var(--sub)'}">${esc(x.due || '—')}</td>
    <td><button class="btn sm" data-act="editBug" data-id="${x.id}">明细</button></td>
  </tr>`).join('');

  return `
  <div class="sec-title">
    <h2>缺陷管理</h2>
    <span class="desc">卡片可拖拽换列 · 严重缺陷未关闭即阻塞研发测试准出</span>
    <button class="btn sm no-print" style="margin-left:auto" data-act="exportBugCsv">导出 CSV</button>
    <button class="btn sm primary no-print" data-act="addBug">＋ 登记缺陷</button>
  </div>

  <div class="grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:14px">
    <div class="kpi"><div class="k">缺陷总数</div><div class="v">${b.total}</div><div class="m">累计登记</div></div>
    <div class="kpi ${b.open ? 'alert' : 'ok'}"><div class="k">未关闭</div><div class="v">${b.open}</div><div class="m">含关闭与豁免前全部</div></div>
    <div class="kpi ${b.crit ? 'alert' : 'ok'}"><div class="k">致命 / 严重</div><div class="v">${b.crit}</div><div class="m">阻断准出的关键项</div></div>
    <div class="kpi ok"><div class="k">缺陷关闭率</div><div class="v">${b.rate}<small>%</small></div><div class="m">已关闭 ${b.closed} 个</div></div>
  </div>

  <div class="card" style="margin-bottom:12px">
    <div class="card-h"><h3>缺陷看板</h3><span class="sub">新建 → 处理中 → 待验证 → 已关闭</span></div>
    <div class="card-b"><div class="kanban">${kanban}</div></div>
  </div>

  <div class="card" style="overflow:hidden">
    <div class="card-h" style="flex-wrap:wrap">
      <h3>缺陷清单</h3>
      <div class="right" style="display:flex;gap:6px;flex-wrap:wrap">
        <input class="inp" style="width:170px" placeholder="搜索编号/标题/责任人" value="${esc(f.q)}" data-act="bugQ">
        <select class="inp" style="width:120px" data-act="bugFilterSev">
          <option value="all">全部等级</option>
          ${Object.keys(SEVERITY).map(k => `<option value="${k}" ${f.sev === k ? 'selected' : ''}>${SEVERITY[k].t}</option>`).join('')}
        </select>
        <select class="inp" style="width:120px" data-act="bugFilterStatus">
          <option value="all">全部状态</option>
          ${BUG_STATUS.map(s => `<option value="${s}" ${f.status === s ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </div>
    </div>
    <table class="tbl">
      <thead><tr>
        <th>编号</th><th>标题</th><th>等级</th><th>状态</th><th>责任人</th>
        <th>阶段</th><th>版本</th><th>发现</th><th>要求关闭</th><th></th>
      </tr></thead>
      <tbody>${rows || `<tr><td colspan="10"><div class="empty">暂无缺陷。测试中发现问题时随手登记，验收时才有据可查。</div></td></tr>`}</tbody>
    </table>
  </div>`;
}
/* =========================================================
   视图：每日记录
   ========================================================= */
function logFields(l) {
  l = l || {};
  return `
  <div class="grid" style="grid-template-columns:1fr 1fr;gap:10px">
    <div class="field"><label>日期</label><input class="inp" type="date" id="lDate" value="${esc(l.date || today())}"></div>
    <div class="field"><label>所属阶段</label><select class="inp" id="lStage">
      ${activeStages().map(s => `<option value="${s.id}" ${(l.stage || 'rd') === s.id ? 'selected' : ''}>${s.no} ${esc(s.name)}</option>`).join('')}
    </select></div>
  </div>
  <div class="field" style="margin-top:10px"><label>记录人</label>
    <input class="inp" id="lAuthor" value="${esc(l.author || S.meta.owner || '')}" placeholder="姓名"></div>

  <div class="field" style="margin-top:10px"><label>今日完成 / 进度更新</label>
    <textarea class="inp" id="lDone" placeholder="例：完成内场灵敏度测试 3 个频点；版本 V2.3.1 新增项执行 8/10">${esc(l.done || '')}</textarea></div>

  <div class="field" style="margin-top:10px"><label>问题点 <span style="color:var(--mute);font-weight:400">一行一条</span></label>
    <textarea class="inp" id="lIssues" style="border-color:#f0d5d5" placeholder="例：2.4G 频段灵敏度低于指标 3dB">${esc(l.issues || '')}</textarea></div>

  <div class="field" style="margin-top:10px"><label>阻碍点 <span style="color:var(--mute);font-weight:400">一行一条，卡住进度的事</span></label>
    <textarea class="inp" id="lBlockers" style="border-color:#f2e0c4" placeholder="例：屏蔽暗室被其他项目占用至周五，外场测试无法开展">${esc(l.blockers || '')}</textarea></div>

  <div class="field" style="margin-top:10px"><label>解决方法 / 应对措施</label>
    <textarea class="inp" id="lSolutions" placeholder="例：已协调周三下午优先使用暗室；灵敏度问题定位为射频链路插损，已提缺陷单 BUG-231">${esc(l.solutions || '')}</textarea></div>

  <div class="field" style="margin-top:10px"><label>需要的资源 / 支持</label>
    <textarea class="inp" id="lResources" style="min-height:52px" placeholder="例：需增配 1 台频谱仪；需项目经理批准延期 2 天">${esc(l.resources || '')}</textarea></div>

  <div class="field" style="margin-top:10px"><label>明日计划</label>
    <textarea class="inp" id="lPlan" style="min-height:52px" placeholder="例：完成高低温 -40℃ 阶段测试">${esc(l.plan || '')}</textarea></div>`;
}

function val(id) { const e = $(id); return e ? e.value : ''; }

function readLogForm() {
  return {
    date: val('#lDate') || today(),
    stage: val('#lStage'),
    author: val('#lAuthor').trim(),
    done: val('#lDone').trim(),
    issues: val('#lIssues').trim(),
    blockers: val('#lBlockers').trim(),
    solutions: val('#lSolutions').trim(),
    resources: val('#lResources').trim(),
    plan: val('#lPlan').trim()
  };
}

/* ---- 草稿自动保存：写到一半卡死/断电也能找回 ---- */
function getDraft() {
  try { return JSON.parse(localStorage.getItem(DRAFT_KEY + '.' + S.pid) || 'null'); } catch (e) { return null; }
}
function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY + '.' + S.pid); } catch (e) {}
  const m = $('#draftMark'); if (m) m.textContent = '';
}
function saveDraft() {
  try {
    localStorage.setItem(DRAFT_KEY + '.' + S.pid, JSON.stringify({t: Date.now(), d: readLogForm()}));
    const m = $('#draftMark');
    if (m) m.innerHTML = `草稿已自动保存 ${new Date().toLocaleTimeString('zh-CN', {hour12:false})}
      <button class="btn sm ghost" data-act="clearDraft" style="padding:0 4px;color:var(--mute)">清空</button>`;
  } catch (e) {}
}
function bindDraft() {
  const f = $('#logForm');
  if (!f) return;
  f.querySelectorAll('input,textarea,select').forEach(el => {
    el.addEventListener('input', saveDraft);
    el.addEventListener('change', saveDraft);
  });
}

function renderLogs() {
  const logs = S.logs.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const days = new Set(logs.map(l => l.date)).size;
  const openCnt = issuesAll().filter(x => !x.closed).length;
  const wk = weekRangeOf(today());
  const dft = getDraft();
  const useDraft = dft && dft.d && (Date.now() - dft.t < 24 * 3600e3);

  const tl = logs.map(l => {
    const st = stageById(l.stage);
    const its = lines(l.issues), bks = lines(l.blockers), res = lines(l.resources);
    return `<div class="tlitem">
      <div class="tlcard">
        <div class="tlhead">
          <span class="tldate">${esc(l.date)}</span>
          <span class="tag" style="background:${st.tone}14;color:${st.tone}">${esc(st.name)}</span>
          ${l.author ? `<span style="font-size:11px;color:var(--mute)">${esc(l.author)}</span>` : ''}
          <span style="margin-left:auto;display:flex;gap:4px" class="no-print">
            <button class="btn sm ghost" data-act="editLog" data-id="${l.id}">编辑</button>
            <button class="btn sm ghost" data-act="delLog" data-id="${l.id}">删除</button>
          </span>
        </div>
        ${l.done ? `<div class="tltext">${esc(l.done)}</div>` : ''}
        ${its.length ? `<div class="mini-lbl">问题点</div>${its.map(t => `<div style="font-size:12px;color:#b3261e">· ${esc(t)}</div>`).join('')}` : ''}
        ${bks.length ? `<div class="mini-lbl">阻碍点</div>${bks.map(t => `<div style="font-size:12px;color:#a35c05">· ${esc(t)}</div>`).join('')}` : ''}
        ${l.solutions ? `<div class="mini-lbl">解决方法</div><div class="tltext" style="color:var(--ok);font-size:12px">${esc(l.solutions)}</div>` : ''}
        ${res.length ? `<div class="mini-lbl">需要资源</div>${res.map(t => `<div style="font-size:12px;color:#5b2fd6">· ${esc(t)}</div>`).join('')}` : ''}
        ${l.plan ? `<div class="mini-lbl">明日计划</div><div class="tltext" style="font-size:12px;color:var(--sub)">${esc(l.plan)}</div>` : ''}
      </div>
    </div>`;
  }).join('') || `<div class="empty">还没有任何记录。<br>右侧填写今天的第一条，坚持每天一条，进度自然清晰。</div>`;

  return `
  <div class="sec-title">
    <h2>每日记录</h2>
    <span class="desc">记录天数 ${days} · 未闭环问题 ${openCnt}</span>
  </div>
  <div class="split">
    <div>
      <div class="card">
        <div class="card-h"><h3>记录时间线</h3><span class="sub">${logs.length} 条</span></div>
        <div class="card-b"><div class="tl">${tl}</div></div>
      </div>
    </div>
    <div>
      <div class="card" id="logForm">
        <div class="card-h">
          <h3>新增记录</h3>
          <span class="sub">${useDraft ? '已恢复上次未保存的草稿' : '默认今天'}</span>
        </div>
        <div class="card-b">
          ${logFields(useDraft ? dft.d : {})}
          <div id="draftMark" style="font-size:11px;color:var(--ok);margin-top:8px;min-height:15px"></div>
          <button class="btn primary" style="width:100%;margin-top:10px;justify-content:center" data-act="saveLog">保存今日记录</button>
          <div style="font-size:11px;color:var(--mute);margin-top:8px;line-height:1.5">
            边写边自动存草稿，卡死或断电后重开仍在；问题点与阻碍点会自动汇总到「问题与阻碍」页；
            跨过一周后打开本工具会自动生成周报草稿，可在「周报」页查看与润色。
          </div>
        </div>
      </div>

      <div class="card" style="margin-top:14px">
        <div class="card-h"><h3>本周概览</h3><span class="sub">${wk.start} ~ ${wk.end}</span></div>
        <div class="card-b" style="font-size:12.5px;line-height:1.9;color:var(--ink2)">
          本周已记录 <b>${logs.filter(l => l.date >= wk.start && l.date <= wk.end).length}</b> 条 ·
          累计 <b>${logs.length}</b> 条（${days} 天）<br>
          未闭环问题与阻碍 <b style="color:${openCnt ? 'var(--bad)' : 'var(--ok)'}">${openCnt}</b> 条
          <div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap">
            <button class="btn sm" data-act="goWeekly">查看 / 生成本周周报</button>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

function editLogModal(id) {
  const l = S.logs.find(x => x.id === id);
  if (!l) return;
  openModal('编辑记录 · ' + l.date, logFields(l),
    `<button class="btn" data-close>取消</button><button class="btn primary" data-act="updateLog" data-id="${id}">保存修改</button>`);
}

/* =========================================================
   视图：问题与阻碍
   ========================================================= */
/* =========================================================
   视图：资源调度（排期排档 · 冲突协商 · 交叉测试）
   ========================================================= */
const RES_VIEW = {mode: 'day', date: null, typeId: 'all', onlyMine: false};
function resCurDate() { return RES_VIEW.date || today(); }
function resShift(n) {
  const d = new Date(resCurDate() + 'T00:00:00');
  d.setDate(d.getDate() + n);
  const p = x => String(x).padStart(2, '0');
  RES_VIEW.date = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
const RES_DAY0 = 6 * 60, RES_DAY1 = 22 * 60, RES_SPAN = RES_DAY1 - RES_DAY0;
function resRangeOf(list) {
  let s0 = RES_DAY0, e0 = RES_DAY1;
  list.forEach(r => { s0 = Math.min(s0, minOf(r.start)); e0 = Math.max(e0, minOf(r.end)); });
  return {s: Math.max(0, s0 - 30), e: Math.min(24 * 60, e0 + 30)};
}
function renderRes() {
  const cm = resConflictMap();
  const types = resTypes();
  const all = resReqs().slice().sort((a, b) => (a.date || '').localeCompare(b.date || '') || minOf(a.start) - minOf(b.start));
  const pending = all.filter(r => r.status === 'pending').length;
  const todayN = all.filter(r => r.date === today() && (r.status === 'approved' || r.status === 'done')).length;
  const conflictN = Object.keys(cm).length;
  const wk = weekRangeOf(today());
  const weekN = all.filter(r => r.date >= wk.start && r.date <= wk.end).length;

  /* ---------- 日视图：时间轴排档 ---------- */
  const d = resCurDate();
  const dayList = all.filter(r => r.date === d && r.status !== 'rejected'
    && (RES_VIEW.typeId === 'all' || r.typeId === RES_VIEW.typeId));
  const rg = dayList.length ? resRangeOf(dayList) : {s: RES_DAY0, e: RES_DAY1};
  const span = Math.max(60, rg.e - rg.s);
  const ticks = [];
  for (let m = Math.ceil(rg.s / 120) * 120; m <= rg.e; m += 120) ticks.push(m);

  const dayView = types.filter(t => RES_VIEW.typeId === 'all' || t.id === RES_VIEW.typeId).map(t => {
    const rows = dayList.filter(r => r.typeId === t.id);
    const blocks = rows.map(r => {
      const sm = minOf(r.start), em = Math.max(minOf(r.end), sm + 15);
      const left = clamp((sm - rg.s) / span * 100, 0, 100);
      const w = clamp((em - sm) / span * 100, 1.5, 100 - left);
      const cf = cm[r.id];
      const cls = 'rb ' + (r.status === 'approved' ? 'ok' : r.status === 'done' ? 'fin' : 'wait') + (cf ? ' cf' : '');
      const ng = r.nego ? `<span class="rbn ${r.nego.status === 'agreed' ? 'ok' : r.nego.status === 'rejected' ? 'no' : 'wait'}">${
        r.nego.status === 'agreed' ? '交叉测试·已协商' : r.nego.status === 'rejected' ? '协商未达成' : '协商中'}</span>` : '';
      return `<div class="${cls}" style="left:${left}%;width:${w}%;background:${t.tone}1f;border-color:${cf ? '#d93025' : t.tone}"
        title="${esc((r.applicant || '—') + ' ' + r.start + '-' + r.end + ' · ' + r.purpose)}" data-act="resOpen" data-id="${r.id}">
        <b>${esc(r.applicant || '—')}</b><span>${esc(r.start)}-${esc(r.end)} · ${r.qty}${esc((resTypeById(r.typeId) || {}).unit || '')}</span>
        ${cf ? '<i>⚠ 冲突</i>' : ''}${ng}</div>`;
    }).join('');
    const usedOf = rows.filter(r => r.status === 'approved').reduce((a, b) => a + (Number(b.qty) || 0), 0);
    return `<div class="resrow">
      <div class="resrow-h"><span class="ric">${esc(t.icon || '📦')}</span>
        <div style="min-width:0"><div class="rn">${esc(t.name)}</div>
          <div class="rm">${usedOf}/${t.total} ${esc(t.unit)} 已排${t.note ? ' · ' + esc(t.note) : ''}</div></div></div>
      <div class="restrack">${blocks || '<span class="resnone">当日无排期</span>'}</div>
    </div>`;
  }).join('');

  /* ---------- 周视图：日期 × 资源 网格 ---------- */
  const days = [];
  for (let i = 0; i < 7; i++) {
    const dt = new Date(wk.start + 'T00:00:00'); dt.setDate(dt.getDate() + i);
    const p = x => String(x).padStart(2, '0');
    days.push(`${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}`);
  }
  const weekView = `<div class="tblwrap"><table class="tbl restbl">
    <thead><tr><th style="width:120px">资源</th>${days.map(x => `<th>${x.slice(5)}${x === today() ? ' <span class="tag b">今</span>' : ''}</th>`).join('')}</tr></thead>
    <tbody>${types.map(t => `<tr>
      <td><span class="ric">${esc(t.icon || '📦')}</span> ${esc(t.name)}<div class="rm">共 ${t.total}${esc(t.unit)}</div></td>
      ${days.map(dd => {
        const rs = all.filter(r => r.typeId === t.id && r.date === dd && r.status !== 'rejected');
        if (!rs.length) return '<td></td>';
        return `<td>${rs.map(r => {
          const cf = cm[r.id];
          return `<div class="rchip ${cf ? 'cf' : ''}" style="border-color:${cf ? '#d93025' : t.tone};background:${t.tone}14" data-act="resOpen" data-id="${r.id}">
            <b>${esc(r.start)}-${esc(r.end)}</b> ${esc(r.applicant || '—')} · ${r.qty}${esc(t.unit)}
            ${cf ? '<i>⚠</i>' : ''}</div>`;
        }).join('')}</td>`;
      }).join('')}
    </tr>`).join('')}</tbody></table></div>`;

  /* ---------- 申请列表 ---------- */
  const list = all.filter(r => RES_VIEW.typeId === 'all' || r.typeId === RES_VIEW.typeId);
  const table = list.length ? `<div class="tblwrap"><table class="tbl">
    <thead><tr><th style="width:110px">资源</th><th style="width:88px">申请人</th><th style="width:96px">日期</th>
      <th style="width:110px">时段</th><th style="width:60px">数量</th><th>用途 / 测试内容</th>
      <th style="width:80px">状态</th><th style="width:150px">冲突 / 协商</th><th style="width:130px" class="no-print">操作</th></tr></thead>
    <tbody>${list.map(r => {
      const t = resTypeById(r.typeId) || {name:'（已删除类型）', unit:'', icon:'📦', tone:'#64748b'};
      const cf = cm[r.id];
      const st = RES_STATUS[r.status] || RES_STATUS.pending;
      const owners = (cf ? cf.withIds : []).map(id => (resReqs().find(x => x.id === id) || {}).applicant).filter(Boolean);
      return `<tr>
        <td><span class="ric">${esc(t.icon)}</span> ${esc(t.name)}</td>
        <td>${esc(r.applicant || '—')}</td>
        <td>${esc(r.date)}</td>
        <td>${esc(r.start)} ~ ${esc(r.end)}</td>
        <td>${r.qty}${esc(t.unit)}</td>
        <td style="font-size:11.5px;color:var(--sub)">${esc(r.purpose || '—')}${r.projName ? ` <span class="tag m">${esc(r.projName)}</span>` : ''}</td>
        <td><span class="tag ${st.k}">${st.t}</span></td>
        <td>${cf ? `<div style="font-size:11px;line-height:1.5"><span style="color:var(--bad)">⚠ 与 ${esc(owners.join('、') || '他人')} 时段冲突（晚提交）</span>
            ${r.nego ? `<div>协商：${r.nego.status === 'agreed' ? '<b style="color:var(--ok)">已同意交叉测试</b>' : r.nego.status === 'rejected' ? '<span style="color:var(--bad)">未达成</span>' : '<span style="color:var(--warn)">等待对方确认</span>'}</div>`
              : `<button class="btn sm" style="margin-top:3px" data-act="negoStart" data-id="${r.id}">发起协商</button>`}</div>`
          : '<span style="color:var(--mute)">无冲突</span>'}</td>
        <td class="no-print">${isLeader() ? `
          ${r.status === 'pending' ? `<button class="btn sm primary" data-act="resApprove" data-id="${r.id}">批准</button>
            <button class="btn sm ghost" data-act="resReject" data-id="${r.id}">驳回</button>` : ''}
          ${r.status === 'approved' ? `<button class="btn sm" data-act="resDone" data-id="${r.id}">完成</button>` : ''}` : ''}
          <button class="btn sm ghost" data-act="resOpen" data-id="${r.id}">详情</button>
        </td></tr>`;
    }).join('')}</tbody></table></div>` : `<div class="empty">还没有资源申请。点右上角「＋ 申请资源」登记第一条排期。</div>`;

  return `
  <div class="sec-title">
    <h2>资源调度</h2>
    <span class="desc">按日期 + 时间段排期排档 ｜ 同资源同时段超量即冲突，晚提交者需与先提交者协商交叉测试</span>
    <div style="margin-left:auto;display:flex;gap:6px" class="no-print">
      <button class="btn sm ${RES_VIEW.mode === 'day' ? 'primary' : ''}" data-act="resMode" data-id="day">日排档</button>
      <button class="btn sm ${RES_VIEW.mode === 'week' ? 'primary' : ''}" data-act="resMode" data-id="week">本周档</button>
      <button class="btn sm ${RES_VIEW.mode === 'list' ? 'primary' : ''}" data-act="resMode" data-id="list">申请列表</button>
      ${isLeader() ? '<button class="btn sm" data-act="resTypeMgr">🗂 资源类型管理</button>' : ''}
      <button class="btn sm primary" data-act="resAdd">＋ 申请资源</button>
    </div>
  </div>

  <div class="grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:14px">
    <div class="kpi"><div class="k">今日已排资源</div><div class="v">${todayN}</div><div class="m">含已完成</div></div>
    <div class="kpi ${pending ? 'alert' : 'ok'}"><div class="k">待审批</div><div class="v">${pending}</div><div class="m">组长审批后入档</div></div>
    <div class="kpi ${conflictN ? 'alert' : 'ok'}"><div class="k">排期冲突</div><div class="v">${conflictN}</div><div class="m">需协商交叉测试</div></div>
    <div class="kpi"><div class="k">本周申请</div><div class="v">${weekN}</div><div class="m">${wk.start} ~ ${wk.end}</div></div>
  </div>

  ${RES_VIEW.mode === 'list' ? `
    <div class="card" style="padding:14px 16px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
        <b style="font-size:13px">全部申请（${list.length}）</b>
        <select class="inp mini no-print" data-act="resFilter" style="margin-left:auto;max-width:180px">
          <option value="all"${RES_VIEW.typeId === 'all' ? ' selected' : ''}>全部资源</option>
          ${types.map(t => `<option value="${t.id}"${RES_VIEW.typeId === t.id ? ' selected' : ''}>${esc(t.icon)} ${esc(t.name)}</option>`).join('')}
        </select>
      </div>
      ${table}
    </div>` : ''}

  ${RES_VIEW.mode === 'day' ? `
    <div class="card" style="padding:14px 16px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px" class="no-print">
        <button class="btn sm ghost" data-act="resPrev">‹ 前一天</button>
        <input type="date" class="inp mini" style="max-width:150px" value="${esc(d)}" data-act="resDate">
        <button class="btn sm ghost" data-act="resNext">后一天 ›</button>
        <button class="btn sm" data-act="resToday">回到今天</button>
        <span style="margin-left:auto;font-size:11.5px;color:var(--mute)">点击色块可查看详情 / 编辑（本人或组长）</span>
      </div>
      <div class="resaxis">
        <div class="resaxis-h"></div>
        <div class="resaxis-t">${ticks.map(m => `<span style="left:${(m - rg.s) / span * 100}%">${fmtMin(m)}</span>`).join('')}</div>
      </div>
      ${dayView}
    </div>` : ''}

  ${RES_VIEW.mode === 'week' ? `<div class="card" style="padding:14px 16px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
        <b style="font-size:13px">本周档期</b>
        <span style="margin-left:auto;font-size:11.5px;color:var(--mute)">${wk.start} ~ ${wk.end}</span>
      </div>
      ${weekView}
    </div>` : ''}

  ${conflictN ? `<div class="recov no-print" style="margin-top:14px">
    <span style="font-size:15px">⚠</span>
    <div>存在 <b>${conflictN}</b> 条排期冲突：同一资源在重叠时段被超额占用。<b>晚提交的一方需主动联系先提交者协商交叉测试</b>，协商一致后在申请里标记「交叉测试 · 已协商」。</div>
  </div>` : ''}`;
}

/* ---------- 资源申请弹窗 ---------- */
/* ---------- 清单式申请：一次申请多种资源，保存时自动拆分为多条排期 ---------- */
const RES_BATCH = {rows: []};
function resBatchModal() {
  RES_BATCH.rows = [{typeId: (resTypes()[0] || {}).id, qty: 1}];
  const tpls = WS.res.templates || [];
  openModal('申请资源（清单）', `
    <div class="grid" style="grid-template-columns:1fr 1fr;gap:12px">
      <div class="field"><label>申请人</label>
        <input class="inp" id="rsWho" value="${esc(meName() || '')}" placeholder="姓名"></div>
      <div class="field"><label>关联项目</label>
        <input class="inp" value="${esc((S.meta && S.meta.name) || '')}" disabled></div>
    </div>
    <div class="grid" style="grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:12px">
      <div class="field"><label>日期</label><input class="inp" type="date" id="rsDate" value="${esc(today())}"></div>
      <div class="field"><label>开始时间</label><input class="inp" type="time" id="rsStart" value="09:00"></div>
      <div class="field"><label>结束时间</label><input class="inp" type="time" id="rsEnd" value="12:00"></div>
    </div>
    <div class="field" style="margin-top:12px"><label>用途 / 测试内容（本清单共用）</label>
      <input class="inp" id="rsPurpose" placeholder="例：外场侦测距离测试（S4 研发测试）"></div>
    <div class="hr"></div>
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
      <b style="font-size:12.5px">资源清单 <span id="rsCount" class="tag b">1</span></b>
      <span style="margin-left:auto;font-size:11px;color:var(--mute)">保存后自动按行拆分为多条排期</span>
    </div>
    ${tpls.length ? `<div style="display:flex;gap:6px;align-items:center;margin-bottom:8px">
      <select class="inp mini" id="rsTplPick" data-act="batchTplPick" style="max-width:220px">
        <option value="">📄 载入常用清单…</option>
        ${tpls.map(t => `<option value="${t.id}">${esc(t.name)}（${t.items.length} 项）</option>`).join('')}
      </select>
      <button class="btn sm ghost" data-act="batchTplDel" title="删除选中的常用清单">🗑</button>
    </div>` : ''}
    <div id="rsRows"></div>
    <div style="display:flex;gap:6px;margin-top:8px">
      <button class="btn sm" data-act="batchRowAdd">＋ 添加一行</button>
      <input class="inp mini" id="tplName" placeholder="常用清单名称" style="max-width:150px;margin-left:auto">
      <button class="btn sm" data-act="batchTplSave" title="把当前清单保存为模板，下次一键载入">💾 存为常用清单</button>
    </div>
    <div style="margin-top:12px;font-size:11.5px;color:var(--mute);line-height:1.7">
      同一时段用到的无人机、网关、车辆等一次勾齐，系统自动逐项生成排期并检测冲突；若与先提交的同事冲突，晚提交方需协商交叉测试。</div>
  `, `<button class="btn" data-close>取消</button>
      <button class="btn primary" data-act="saveResBatch">提交清单（自动拆分排期）</button>`);
  renderBatchRows();
}
/** 记录 / 恢复清单弹窗中已填的共用字段（重建弹窗时不丢内容）：
    batchSnap() 捕获当前值；batchSnap(snap) 用此前捕获的快照回填 */
function batchSnap(snap) {
  if (snap && typeof snap === 'object') {
    $('#rsWho').value = snap.who || '';
    $('#rsDate').value = snap.date || today();
    $('#rsStart').value = snap.start || '09:00';
    $('#rsEnd').value = snap.end || '12:00';
    $('#rsPurpose').value = snap.purpose || '';
    return snap;
  }
  const g = id => { const el = $('#' + id); return el ? el.value : null; };
  return {who: g('rsWho'), date: g('rsDate'), start: g('rsStart'), end: g('rsEnd'), purpose: g('rsPurpose')};
}
function renderBatchRows() {
  const el = $('#rsRows'); if (!el) return;
  const types = resTypes();
  el.innerHTML = RES_BATCH.rows.map((r, i) => `<div class="rs-row">
    <select class="inp" data-act="batchRowType" data-i="${i}">
      ${types.map(t => `<option value="${t.id}"${r.typeId === t.id ? ' selected' : ''}>${esc(t.icon || '📦')} ${esc(t.name)}（共 ${t.total}${esc(t.unit)}）</option>`).join('')}
    </select>
    <input class="inp" type="number" min="1" value="${r.qty || 1}" data-act="batchRowQty" data-i="${i}" title="数量">
    <button class="btn sm ghost" data-act="batchRowDel" data-i="${i}" ${RES_BATCH.rows.length > 1 ? '' : 'disabled'}>✕</button>
  </div>`).join('');
  const c = $('#rsCount'); if (c) c.textContent = RES_BATCH.rows.length;
}

function resReqModal(r) {
  r = r || {};
  const types = resTypes();
  if (!types.length) { toast('请先在「资源类型管理」里添加资源'); return; }
  const mine = meName();
  const isNew = !r.id;
  const canEdit = isNew || isLeader() || iAm(r.applicant);
  const cm = resConflictMap();
  openModal(isNew ? '申请资源' : '资源申请详情', `
    <div class="grid" style="grid-template-columns:1fr 1fr;gap:12px">
      <div class="field"><label>资源类型</label>
        <select class="inp" id="rsType" ${canEdit ? '' : 'disabled'}>
          ${types.map(t => `<option value="${t.id}"${r.typeId === t.id ? ' selected' : ''}>${esc(t.icon)} ${esc(t.name)}（共 ${t.total}${esc(t.unit)}）</option>`).join('')}
        </select></div>
      <div class="field"><label>申请人</label>
        <input class="inp" id="rsWho" value="${esc(r.applicant || mine || '')}" placeholder="姓名" ${canEdit ? '' : 'disabled'}></div>
    </div>
    <div class="grid" style="grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:12px">
      <div class="field"><label>日期</label><input class="inp" type="date" id="rsDate" value="${esc(r.date || today())}" ${canEdit ? '' : 'disabled'}></div>
      <div class="field"><label>开始时间</label><input class="inp" type="time" id="rsStart" value="${esc(r.start || '09:00')}" ${canEdit ? '' : 'disabled'}></div>
      <div class="field"><label>结束时间</label><input class="inp" type="time" id="rsEnd" value="${esc(r.end || '12:00')}" ${canEdit ? '' : 'disabled'}></div>
    </div>
    <div class="field" style="margin-top:12px"><label>数量</label>
      <input class="inp" type="number" min="1" id="rsQty" value="${r.qty || 1}" ${canEdit ? '' : 'disabled'}></div>
    <div class="field" style="margin-top:12px"><label>用途 / 测试内容</label>
      <input class="inp" id="rsPurpose" value="${esc(r.purpose || '')}" placeholder="例：外场侦测距离测试（S4 研发测试）" ${canEdit ? '' : 'disabled'}></div>
    ${!isNew ? `<div class="hr"></div>
      <div style="font-size:12px;line-height:1.9">
        <div>状态：<span class="tag ${(RES_STATUS[r.status] || RES_STATUS.pending).k}">${(RES_STATUS[r.status] || RES_STATUS.pending).t}</span></div>
        <div style="color:var(--mute)">提交时间：${r.created ? fmtTime(r.created) : '—'}</div>
        ${cm[r.id] ? `<div style="color:var(--bad)">⚠ 该申请与先提交者的排期冲突，需协商交叉测试</div>` : ''}
        ${r.nego ? `<div>协商对象：<b>${esc(r.nego.toName || '—')}</b> ｜ 状态：${
          r.nego.status === 'agreed' ? '<b style="color:var(--ok)">已同意交叉测试</b>' : r.nego.status === 'rejected' ? '<span style="color:var(--bad)">未达成</span>' : '<span style="color:var(--warn)">等待确认</span>'}</div>
          ${r.nego.note ? `<div style="color:var(--mute)">说明：${esc(r.nego.note)}</div>` : ''}` : ''}
      </div>` : `<div style="margin-top:12px;font-size:11.5px;color:var(--mute);line-height:1.7">
        提交后由组长审批入档；若与已有排期冲突，系统会提示你与先提交的同事协商交叉测试。</div>`}
  `, `<button class="btn" data-close>${canEdit ? '取消' : '关闭'}</button>
      ${!isNew && canEdit ? '<button class="btn danger" data-act="resDel" data-id="' + r.id + '">删除申请</button>' : ''}
      ${!isNew && cm[r.id] && !r.nego ? `<button class="btn" data-act="negoStart" data-id="${r.id}">⚠ 发起交叉测试协商</button>` : ''}
      ${!isNew && r.nego && r.nego.status === 'waiting' && (isLeader() || iAm(r.nego.toName))
        ? `<button class="btn primary" data-act="negoAgree" data-id="${r.id}">同意交叉测试</button>
           <button class="btn danger" data-act="negoReject" data-id="${r.id}">协商未达成</button>` : ''}
      ${canEdit ? `<button class="btn primary" data-act="saveRes" data-id="${r.id || ''}">保存</button>` : ''}`);
}

/* ---------- 资源类型管理（组长） ---------- */
function resTypeMgrModal() {
  if (!isLeader()) { toast('仅组长可管理资源类型'); return; }
  const types = resTypes();
  openModal('资源类型管理', `
    <div class="tblwrap"><table class="tbl">
      <thead><tr><th style="width:40px">图标</th><th>名称</th><th style="width:70px">单位</th>
        <th style="width:90px">总量</th><th>说明</th><th style="width:110px" class="no-print">操作</th></tr></thead>
      <tbody>${types.map(t => `<tr>
        <td style="font-size:16px">${esc(t.icon || '📦')}</td>
        <td style="font-weight:700">${esc(t.name)}</td>
        <td>${esc(t.unit)}</td><td>${t.total}</td>
        <td style="font-size:11.5px;color:var(--sub)">${esc(t.note || '—')}</td>
        <td class="no-print"><button class="btn sm" data-act="editResType" data-id="${t.id}">编辑</button>
          <button class="btn sm ghost" data-act="delResType" data-id="${t.id}">删除</button></td></tr>`).join('')}</tbody>
    </table></div>
    <div style="margin-top:12px;font-size:11.5px;color:var(--mute);line-height:1.7">
      总量用于冲突判定：同一资源同一时段被占用的数量总和超过总量，晚提交的申请会被标记冲突。
    </div>`, `<button class="btn" data-close>关闭</button><button class="btn primary" data-act="addResType">＋ 新增资源类型</button>`);
}
function resTypeModal(t) {
  t = t || {};
  const icons = ['🚁','📡','🖥','🚗','🔋','🛰','📷','🧰','🔌','📻','🛺','🧪'];
  openModal(t.id ? '编辑资源类型' : '新增资源类型', `
    <div class="field"><label>名称 <b style="color:#c23">*</b></label>
      <input class="inp" id="rtName" value="${esc(t.name || '')}" placeholder="例：频谱仪 / 假目标源"></div>
    <div class="grid" style="grid-template-columns:1fr 1fr;gap:12px;margin-top:12px">
      <div class="field"><label>计量单位</label><input class="inp" id="rtUnit" value="${esc(t.unit || '台')}" placeholder="台 / 架 / 辆 / 席位"></div>
      <div class="field"><label>可用总量</label><input class="inp" type="number" min="0" id="rtTotal" value="${t.total == null ? 1 : t.total}"></div>
    </div>
    <div class="field" style="margin-top:12px"><label>图标</label>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">
        ${icons.map(ic => `<button type="button" class="btn sm ${t.icon === ic ? 'primary' : ''}" data-act="pickIcon" data-id="${ic}" style="font-size:15px;padding:4px 8px">${ic}</button>`).join('')}
      </div>
      <input type="hidden" id="rtIcon" value="${esc(t.icon || '📦')}"></div>
    <div class="field" style="margin-top:12px"><label>说明</label>
      <input class="inp" id="rtNote" value="${esc(t.note || '')}" placeholder="用途 / 配件 / 使用注意"></div>`,
    `<button class="btn" data-close>取消</button><button class="btn primary" data-act="saveResType" data-id="${t.id || ''}">保存</button>`);
}

/* ---------- 协商（交叉测试） ---------- */
function negoModal(r) {
  const cm = resConflictMap();
  const cf = cm[r.id] || {withIds: []};
  const others = cf.withIds.map(id => resReqs().find(x => x.id === id)).filter(Boolean);
  const t = resTypeById(r.typeId) || {};
  openModal('协商交叉测试', `
    <div style="font-size:12.5px;line-height:1.9;margin-bottom:12px">
      你的申请：<b>${esc(t.name || '')}</b> ${esc(r.date)} ${esc(r.start)} ~ ${esc(r.end)} · ${r.qty}${esc(t.unit || '')}<br>
      该时段已被以下同事先占用（总量 ${cf.total || (t.total || '—')}${esc(t.unit || '')}）：<br>
      ${others.map(o => `· <b>${esc(o.applicant || '—')}</b> ${esc(o.start)}~${esc(o.end)} ${o.qty}${esc(t.unit || '')}${o.purpose ? '（' + esc(o.purpose) + '）' : ''}`).join('<br>') || '（无）'}
    </div>
    <div class="field"><label>协商说明（给对方看）</label>
      <input class="inp" id="ngNote" placeholder="例：申请 10:00-11:00 交叉使用，我先做内场，可错峰"></div>
    <div style="margin-top:10px;font-size:11.5px;color:var(--mute);line-height:1.7">
      提交后该申请标记为「协商中」，对方或组长确认同意后转为「交叉测试 · 已协商」，双方即可在同一时段交叉使用。
    </div>`,
    `<button class="btn" data-close>取消</button><button class="btn primary" data-act="saveNego" data-id="${r.id}">提交协商</button>`);
}

/* =========================================================
   视图：账户管理（组长）
   ========================================================= */
function renderAccounts() {
  if (!isLeader()) {
    return `<div class="sec-title"><h2>账户管理</h2><span class="desc">仅组长可用</span></div>
      <div class="empty">当前是组员身份，无权查看账户管理。请用组长账户登录。</div>`;
  }
  const accs = WS.accounts || [];
  const rows = accs.map(a => `<tr>
    <td style="font-weight:700">${esc(a.name || a.user)}</td>
    <td>${esc(a.user)}</td>
    <td><span class="tag ${a.role === 'leader' ? 'b' : 'm'}">${a.role === 'leader' ? '👑 组长' : '👤 组员'}</span></td>
    <td style="font-size:11.5px;color:var(--sub)">${esc(a.name || '未绑定')}</td>
    <td style="font-size:11.5px;color:var(--mute)">${a.created ? fmtTime(a.created) : '—'}</td>
    <td class="no-print"><button class="btn sm" data-act="editAcc" data-id="${a.id}">编辑</button>
      <button class="btn sm ghost" data-act="delAcc" data-id="${a.id}">删除</button></td></tr>`).join('');
  return `
  <div class="sec-title">
    <h2>账户与权限</h2>
    <span class="desc">组长看全部内容与明细；组员仅看他人「总览进度 / 问题阻碍 / 资源申请」，且只能改自己的记录</span>
    <button class="btn primary no-print" style="margin-left:auto" data-act="addAcc">＋ 新建账户</button>
  </div>
  <div class="card" style="padding:14px 16px;margin-bottom:14px">
    <div style="font-size:12px;line-height:1.9;color:var(--sub)">
      · <b>本机轻量身份</b>：账户与口令保存在本机浏览器中，用于区分「组长 / 组员」视图与可编辑范围，不是加密级鉴权；<br>
      · 组员登录后：自己的每日记录、名下测试项、缺陷、资源申请可编辑；项目信息、门禁判定、组员档案、资源审批仅组长可改；<br>
      · 他人内容对组员只读开放三项：<b>项目总览进度</b>、<b>问题与阻碍</b>、<b>资源申请（日期 / 时段）</b>。
    </div>
  </div>
  <div class="card" style="padding:14px 16px">
    ${accs.length ? `<div class="tblwrap"><table class="tbl">
      <thead><tr><th style="width:110px">姓名</th><th style="width:120px">登录名</th><th style="width:100px">角色</th>
        <th style="width:130px">绑定组员档案</th><th style="width:130px">创建时间</th><th style="width:120px" class="no-print">操作</th></tr></thead>
      <tbody>${rows}</tbody></table></div>` : `<div class="empty">还没有账户。点右上角「＋ 新建账户」为组员开户（不建账户则本机默认以组长身份使用）。</div>`}
  </div>`;
}
function accModal(a) {
  a = a || {};
  const memNames = S.members.map(m => m.name);
  openModal(a.id ? '编辑账户' : '新建账户', `
    <div class="grid" style="grid-template-columns:1fr 1fr;gap:12px">
      <div class="field"><label>姓名 <b style="color:#c23">*</b></label>
        <input class="inp" id="acName" value="${esc(a.name || '')}" placeholder="张三（与组员档案一致才能统计到本人进度）"></div>
      <div class="field"><label>登录名 <b style="color:#c23">*</b></label>
        <input class="inp" id="acUser" value="${esc(a.user || '')}" placeholder="zhangsan"></div>
    </div>
    <div class="grid" style="grid-template-columns:1fr 1fr;gap:12px;margin-top:12px">
      <div class="field"><label>口令</label>
        <input class="inp" id="acPass" type="password" placeholder="${a.id ? '留空表示不修改' : '可留空（无口令直接登录）'}"></div>
      <div class="field"><label>角色</label>
        <select class="inp" id="acRole">
          <option value="member"${a.role === 'member' ? ' selected' : ''}>👤 组员</option>
          <option value="leader"${a.role === 'leader' ? ' selected' : ''}>👑 组长</option>
        </select></div>
    </div>
    ${memNames.length ? `<div style="margin-top:10px;font-size:11px;color:var(--mute)">现有组员档案：${memNames.map(esc).join('、')}</div>` : ''}
    <div style="margin-top:10px;font-size:11.5px;color:var(--mute);line-height:1.7">姓名与「组员进度」里的组员档案同名时，登录后才能看到自己的详细进度并编辑自己的内容。</div>`,
    `<button class="btn" data-close>取消</button><button class="btn primary" data-act="saveAcc" data-id="${a.id || ''}">保存</button>`);
}
function loginModal() {
  const accs = WS.accounts || [];
  openModal('切换身份', `
    <div style="font-size:12px;color:var(--sub);line-height:1.8;margin-bottom:12px">
      当前身份：<b>${isLeader() ? '👑 组长（本机使用者）' : '👤 组员 ' + esc(meName())}</b>
    </div>
    ${accs.length ? `<div class="field"><label>选择账户</label>
      <select class="inp" id="lgUser">
        ${accs.map(a => `<option value="${a.id}">${esc(a.name || a.user)}（${a.role === 'leader' ? '组长' : '组员'}）</option>`).join('')}
      </select></div>
      <div class="field" style="margin-top:10px"><label>口令</label><input class="inp" id="lgPass" type="password" placeholder="无口令可直接登录"></div>` :
      '<div class="empty" style="padding:14px">还没有任何账户。当前按<b>组长</b>身份使用；组长可在左侧「账户与权限」里为组员开户。</div>'}
    <div style="margin-top:12px;font-size:11.5px;color:var(--mute);line-height:1.7">
      · 组长：看全部组员的详细信息与内容，可审批资源、管理账户；<br>
      · 组员：只能看其他组员的<b>项目总览进度</b>、<b>问题阻碍点</b>、<b>资源申请内容及日期</b>，其余内容不可见。
    </div>`,
    `${accs.length ? '<button class="btn primary" data-act="doLogin">登录</button>' : ''}
     <button class="btn" data-act="doLogout">以组长身份使用（本机）</button>
     <button class="btn" data-close>取消</button>`);
}

function renderIssues() {
  const all = issuesAll(), res = resourceAll();
  const issues = all.filter(x => x.kind === 'issue');
  const blockers = all.filter(x => x.kind === 'blocker');
  const open = a => a.filter(x => !x.closed).length;

  const row = x => `
    <div class="isu ${x.closed ? 'fixed' : ''}">
      <div class="ck" data-act="toggleIssue" data-id="${x.id}">${x.closed ? '✓' : ''}</div>
      <div class="ct">
        <div class="tx">${esc(x.text)}</div>
        <div class="mt">
          <span>${esc(x.date)}</span><span>·</span>
          <span>${esc(stageById(x.stage).name)}</span>
          <span style="margin-left:auto">${x.closed ? '已闭环' : '待处理'}</span>
        </div>
      </div>
    </div>`;

  const block = (title, arr, cls, hint) => `
    <div class="card" style="margin-bottom:14px">
      <div class="card-h">
        <h3>${title}</h3>
        <span class="tag ${open(arr) ? cls : 'g'}">${open(arr)} 未闭环</span>
        <span class="sub">${hint}</span>
      </div>
      <div class="card-b">
        ${arr.length ? arr.map(row).join('') : `<div class="empty" style="padding:20px">暂无记录</div>`}
      </div>
    </div>`;

  return `
  <div class="sec-title">
    <h2>问题与阻碍</h2>
    <span class="desc">从每日记录自动汇总 · 点击左侧方框即可闭环</span>
  </div>
  <div class="grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:14px">
    <div class="kpi ${open(blockers) ? 'alert' : 'ok'}"><div class="k">阻碍点</div><div class="v">${open(blockers)}</div><div class="m">共记录 ${blockers.length} 条</div></div>
    <div class="kpi ${open(issues) ? 'alert' : 'ok'}"><div class="k">问题点</div><div class="v">${open(issues)}</div><div class="m">共记录 ${issues.length} 条</div></div>
    <div class="kpi ${open(res) ? 'alert' : 'ok'}"><div class="k">资源需求</div><div class="v">${open(res)}</div><div class="m">共记录 ${res.length} 条</div></div>
  </div>
  ${block('阻碍点 · 卡住进度的事', blockers, 'o', '需协调人/资源/决策')}
  ${block('问题点 · 待定位或待修复', issues, 'r', '需给出结论或登记缺陷单')}
  ${block('资源需求 · 待落实', res, 'p', '设备、场地、人力、授权')}`;
}

/* =========================================================
   周报：按自然周自动汇总 · 可接 AI 生成 / 润色
   ========================================================= */
const firstLine = s => String(s || '').split('\n')[0].trim();
function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  const p = x => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function fmtTime(t) {
  if (!t) return '';
  const d = new Date(t);
  const p = x => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** 取 dateStr 所在自然周（周一~周日）及 ISO 周序号 */
function weekRangeOf(dateStr) {
  const d = new Date((dateStr || today()) + 'T00:00:00');
  const dow = (d.getDay() + 6) % 7;
  const mon = new Date(d); mon.setDate(d.getDate() - dow);
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  const p = n => String(n).padStart(2, '0');
  const f = x => `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`;
  const thu = new Date(mon); thu.setDate(mon.getDate() + 3);
  const y = thu.getFullYear();
  const jan4 = new Date(y, 0, 4);
  const jdow = (jan4.getDay() + 6) % 7;
  const firstThu = new Date(jan4); firstThu.setDate(jan4.getDate() - jdow + 3);
  const wk = 1 + Math.round((thu - firstThu) / (7 * 86400000));
  return {start: f(mon), end: f(sun), key: `${y}-W${p(wk)}`, year: y, week: wk};
}

function weekStats(start, end) {
  const inRange = d => d && d >= start && d <= end;
  const logs = S.logs.filter(l => inRange(l.date)).sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  const pairs = allItems().map(i => ({i, v: getItem(i.key)}));
  const doneItems = pairs.filter(x => x.v.status === 'done' && inRange(x.v.actual));
  const doingItems = pairs.filter(x => Number(x.v.progress) > 0 && Number(x.v.progress) < 100);
  const newBugs = S.bugs.filter(b => inRange(b.found));
  const openBugs = S.bugs.filter(b => b.status !== '已关闭');
  const critBugs = openBugs.filter(b => b.sev === 's1' || b.sev === 's2');
  const iss = issuesAll();
  const newIss = iss.filter(x => inRange(x.date) && x.kind === 'issue');
  const newBlk = iss.filter(x => inRange(x.date) && x.kind === 'blocker');
  const openIss = iss.filter(x => !x.closed);
  const openBlk = openIss.filter(x => x.kind === 'blocker');
  const openIssue = openIss.filter(x => x.kind === 'issue');
  const res = resourceAll().filter(x => !x.closed);
  const stageLines = activeStages().map(st => { const s = stageStat(st); return `${st.no} ${st.name} ${s.pct}%(${s.done}/${s.total})`; });
  return {logs, days: new Set(logs.map(l => l.date)).size, doneItems, doingItems, newBugs, openBugs,
    critBugs, newIss, newBlk, openBlk, openIssue, res, stageLines, o: overall(), bug: bugStat()};
}

/** 本地模板生成周报正文 */
function buildWeeklyBody(start, end) {
  const s = weekStats(start, end);
  const L = [];
  L.push('【本周进展】');
  if (s.doneItems.length) {
    L.push('· 完成测试项 ' + s.doneItems.length + ' 项：' +
      s.doneItems.slice(0, 12).map(x => x.i.name).join('、') + (s.doneItems.length > 12 ? ' 等' : ''));
  } else {
    L.push('· 本周无测试项标记为完成（在「测试项台账」填写实际完成日期后会自动统计）');
  }
  if (s.logs.length) {
    s.logs.slice().sort((a, b) => (b.date || '').localeCompare(a.date || '')).forEach(l => {
      if (l.done) L.push(`· ${l.date}${l.author ? '（' + l.author + '）' : ''}：${firstLine(l.done)}`);
    });
  } else L.push('· 本周没有每日记录');
  L.push(`· 整体进度 ${s.o.pct}%（完成 ${s.o.done}/${s.o.total}，进行中 ${s.o.doing}，阻塞 ${s.o.blocked}）`);
  L.push('· 各阶段：' + s.stageLines.join(' · '));
  L.push('');
  L.push('【问题与阻碍】');
  if (s.newBlk.length) s.newBlk.forEach(x => L.push('· 新增阻碍：' + x.text + (x.closed ? '（已闭环）' : '')));
  else L.push('· 本周无新增阻碍');
  if (s.newIss.length) s.newIss.forEach(x => L.push('· 新增问题：' + x.text + (x.closed ? '（已闭环）' : '')));
  else L.push('· 本周无新增问题');
  L.push(`· 目前仍有 ${s.openBlk.length} 条阻碍、${s.openIssue.length} 条问题未闭环`);
  L.push('');
  L.push('【缺陷情况】');
  L.push('· 本周新增 ' + s.newBugs.length + ' 个' + (s.newBugs.length ? '：' + s.newBugs.map(b => `${b.no}(${SEVERITY[b.sev].t}) ${b.title}`).join('；') : ''));
  L.push(`· 当前未关闭 ${s.openBugs.length} 个，其中致命/严重 ${s.critBugs.length} 个`);
  L.push('');
  L.push('【风险与需支持】');
  if (s.res.length) s.res.forEach(x => L.push('· 需支持：' + x.text));
  else L.push('· 暂无待落实的资源需求');
  if (s.o.blocked) L.push(`· ${s.o.blocked} 个测试项处于阻塞状态，需优先协调`);
  if (s.critBugs.length) L.push(`· ${s.critBugs.length} 个致命/严重缺陷未关闭，影响准出判定`);
  L.push('');
  L.push('【下周计划】');
  const last = s.logs.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0];
  if (last && last.plan) L.push('· ' + firstLine(last.plan));
  L.push(`· 剩余 ${s.o.total - s.o.done} 个测试项待执行，优先推进：` +
    (s.doingItems.slice(0, 5).map(x => x.i.name).join('、') || '待定'));
  return L.join('\n');
}

function genWeekly(start, end, by) {
  const w = weekRangeOf(start);
  const body = buildWeeklyBody(w.start, w.end);
  const exist = S.weeklies.find(x => x.key === w.key);
  const patch = {
    key: w.key, start: w.start, end: w.end,
    title: `${S.meta.name || '测试项目'} · ${w.key} 周报（${w.start} ~ ${w.end}）`,
    body: body, by: by || '本地生成', at: Date.now()
  };
  if (exist) { Object.assign(exist, patch); save(); return exist; }
  const rec = Object.assign({id: uid()}, patch);
  S.weeklies.push(rec);
  S.weeklies.sort((a, b) => (b.start || '').localeCompare(a.start || ''));
  save();
  return rec;
}

/** 打开应用时：跨周自动生成上周 / 本周周报草稿 */
function ensureAutoWeekly() {
  if (!S.backup || S.backup.autoWeekly === false) return null;
  if (!S.logs.length) return null;
  const w = weekRangeOf(today());
  const has = (a, b) => S.logs.some(l => l.date >= a && l.date <= b);
  const prev = weekRangeOf(addDays(w.start, -7));
  let made = null;
  if (has(w.start, w.end) && !S.weeklies.some(x => x.key === w.key)) made = genWeekly(w.start, w.end, '自动');
  else if (!has(w.start, w.end) && has(prev.start, prev.end) && !S.weeklies.some(x => x.key === prev.key)) made = genWeekly(prev.start, prev.end, '自动补生成');
  return made;
}

/* ---- AI 接口 ---- */
function aiCfg() { try { return JSON.parse(localStorage.getItem(AI_KEY) || '{}'); } catch (e) { return {}; } }
function setAiCfg(c) { try { localStorage.setItem(AI_KEY, JSON.stringify(c)); } catch (e) {} }
const AI_PRESETS = [
  {n: 'DeepSeek', base: 'https://api.deepseek.com/v1', model: 'deepseek-chat'},
  {n: '通义千问', base: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-plus'},
  {n: '智谱 GLM', base: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4-flash'},
  {n: 'OpenAI', base: 'https://api.openai.com/v1', model: 'gpt-4o-mini'},
  {n: '本地/Ollama', base: 'http://localhost:11434/v1', model: 'qwen2.5:7b'}
];
const AI_SYS = '你是一名资深测试项目管理人员，擅长把零散的测试日志整理成结构清晰、客观务实、可供上级快速决策的周报。只输出周报正文本身，不要解释说明，不要客套话，使用简体中文。';
const AI_FMT = '请严格按以下结构输出周报：\n一、本周进展（分条，尽量量化）\n二、问题与阻碍（说明影响与当前状态）\n三、缺陷情况\n四、风险与需支持（明确需要谁、在什么时间前提供什么）\n五、下周计划（分条，可衡量）\n\n要求：客观务实，不夸大也不隐藏风险；没有数据的部分直接写“本周无”；不要编造未提供的信息。';

async function callAI(system, user) {
  const c = aiCfg();
  if (!c.base || !c.key || !c.model) throw new Error('AI 接口未配置完整');
  let url = String(c.base).replace(/\/+$/, '');
  if (!/\/chat\/completions$/.test(url)) url += '/chat/completions';
  let r;
  try {
    r = await fetch(url, {
      method: 'POST',
      headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + c.key},
      body: JSON.stringify({model: c.model, temperature: 0.4,
        messages: [{role: 'system', content: system}, {role: 'user', content: user}]})
    });
  } catch (e) {
    throw new Error('网络/跨域失败（' + (e.message || 'fetch error') + '）');
  }
  if (!r.ok) {
    let t = '';
    try { t = (await r.text()).slice(0, 200); } catch (e) {}
    throw new Error('HTTP ' + r.status + ' ' + t);
  }
  const j = await r.json();
  const ch = j && j.choices && j.choices[0];
  const txt = ch && ((ch.message && ch.message.content) || ch.text);
  if (!txt) throw new Error('返回内容为空：' + JSON.stringify(j).slice(0, 200));
  return String(txt).trim();
}

function weeklyPrompt(start, end) {
  const s = weekStats(start, end);
  const P = [];
  P.push(`项目名称：${S.meta.name || '测试项目'}；计划周期：${S.meta.period || '未填写'}；本周区间：${start} ~ ${end}`);
  P.push(`整体进度：${s.o.pct}%（测试项共 ${s.o.total} 个，完成 ${s.o.done}，进行中 ${s.o.doing}，阻塞 ${s.o.blocked}）`);
  P.push('各阶段进度：' + s.stageLines.join('；'));
  P.push(`本周每日记录 ${s.logs.length} 条：`);
  s.logs.forEach(l => P.push(`- ${l.date} ${l.author || ''}｜完成：${l.done || '—'}｜问题：${l.issues || '—'}｜阻碍：${l.blockers || '—'}｜解决：${l.solutions || '—'}｜需资源：${l.resources || '—'}｜次日计划：${l.plan || '—'}`));
  P.push('本周新增缺陷 ' + s.newBugs.length + ' 个：' + (s.newBugs.map(b => `${b.no}(${SEVERITY[b.sev].t}) ${b.title}`).join('；') || '无'));
  P.push(`当前未关闭缺陷 ${s.openBugs.length} 个，其中致命/严重 ${s.critBugs.length} 个`);
  P.push('未闭环阻碍：' + (s.openBlk.map(x => x.text).join('；') || '无'));
  P.push('未闭环问题：' + (s.openIssue.map(x => x.text).join('；') || '无'));
  P.push('待落实资源：' + (s.res.map(x => x.text).join('；') || '无'));
  return P.join('\n');
}

function aiCfgModal() {
  const c = aiCfg();
  openModal('AI 接口设置', `
    <div style="font-size:11.5px;color:var(--mute);line-height:1.7;margin-bottom:10px">
      用于自动生成 / 润色周报。需兼容 OpenAI 的 <span class="pathbox" style="display:inline-block;padding:1px 6px">/chat/completions</span> 接口。
      配置只存在本机，<b>不会写入备份 JSON、不会随分享文件发出</b>。
    </div>
    <div class="preset">
      ${AI_PRESETS.map((p, i) => `<button data-act="aiPreset" data-i="${i}">${p.n}</button>`).join('')}
    </div>
    <div class="field" style="margin-top:12px"><label>接口地址 Base URL</label>
      <input class="inp" id="aiBase" value="${esc(c.base || '')}" placeholder="https://api.deepseek.com/v1"></div>
    <div class="grid" style="grid-template-columns:1fr 1fr;gap:10px;margin-top:10px">
      <div class="field"><label>模型 Model</label><input class="inp" id="aiModel" value="${esc(c.model || '')}" placeholder="deepseek-chat"></div>
      <div class="field"><label>API Key</label><input class="inp" type="password" id="aiKey" value="${esc(c.key || '')}" placeholder="sk-..."></div>
    </div>
    <div class="hr"></div>
    <div style="font-size:11.5px;color:var(--mute);line-height:1.75">
      <b>说明：</b>以本地文件方式打开时，部分接口会被浏览器跨域策略（CORS）拦截。
      遇到这种情况可用周报页的「复制提示词」，在网页版 AI 中生成后粘贴回周报编辑框。<br>
      若公司内网有自建大模型网关，把 Base URL 填成网关地址即可。
    </div>`,
    `<button class="btn" data-close>取消</button><button class="btn primary" data-act="saveAiCfg">保存配置</button>`);
}

let aiText = '';
async function aiWeekly() {
  const w = weekRangeOf(today());
  const c = aiCfg();
  if (!c.base || !c.key || !c.model) { toast('请先配置 AI 接口'); aiCfgModal(); return; }
  const prompt = weeklyPrompt(w.start, w.end);
  let draft = '';
  const cur = S.weeklies.find(x => x.key === w.key);
  if (cur && cur.body) draft = cur.body;
  openModal('AI 生成周报 · ' + w.key, `
    <div id="aiBox" style="min-height:230px">
      <div style="display:flex;align-items:center;gap:8px;color:var(--sub);font-size:12.5px">
        <span class="spin"></span>正在调用 AI 生成，请稍候……
      </div>
    </div>
    <div class="hr"></div>
    <div style="font-size:11.5px;color:var(--mute);line-height:1.7">
      若长时间无响应，多为跨域或网络问题，可关闭后用「复制提示词」在网页版 AI 中生成，再粘贴回周报。
    </div>`,
    `<button class="btn" data-act="copyPrompt">复制提示词</button>
     <button class="btn" data-close>关闭</button>
     <button class="btn primary" id="aiUse" data-act="aiUse" style="display:none">采用这份内容</button>`);
  aiText = '';
  try {
    const user = AI_FMT + '\n\n以下是本周原始数据：\n' + prompt +
      (draft ? '\n\n（附：当前已有一版周报草稿，可在其基础上优化）\n' + draft : '');
    const txt = await callAI(AI_SYS, user);
    aiText = txt;
    $('#aiBox').innerHTML = `<textarea class="inp" id="aiOut" style="min-height:320px;font-size:12.5px;line-height:1.85">${esc(txt)}</textarea>`;
    $('#aiUse').style.display = '';
  } catch (e) {
    $('#aiBox').innerHTML = `<div style="font-size:12.5px;color:var(--bad);line-height:1.8">
      调用失败：${esc(e.message || e)}<br><br>
      常见原因：① API Key 或模型名不对；② 以本地文件方式打开导致的跨域限制；③ 网络或代理不通。<br>
      可点左下角「复制提示词」，粘贴到网页版 AI 生成后再贴回周报编辑框。</div>`;
  }
  window.__aiPrompt = AI_FMT + '\n\n以下是本周原始数据：\n' + prompt;
}

function renderWeekly() {
  const w = weekRangeOf(today());
  const s = weekStats(w.start, w.end);
  const list = S.weeklies.slice().sort((a, b) => (b.start || '').localeCompare(a.start || ''));
  const cur = list.find(x => x.key === w.key);
  const body = cur ? cur.body : buildWeeklyBody(w.start, w.end);

  const hist = list.map(x => `
    <div class="wk">
      <div class="wk-h">
        <span class="wt">${esc(x.key)}</span>
        <span class="ws">${esc(x.start)} ~ ${esc(x.end)}</span>
        <span class="aibadge ${/AI/.test(x.by || '') ? '' : 'local'}">${esc(x.by || '本地生成')}</span>
        <span style="margin-left:auto;display:flex;gap:5px" class="no-print">
          <button class="btn sm ghost" data-act="loadWeekly" data-id="${x.id}">载入到本周</button>
          <button class="btn sm ghost" data-act="dlWeekly" data-id="${x.id}">导出 .md</button>
          <button class="btn sm ghost" data-act="delWeekly" data-id="${x.id}">删除</button>
        </span>
      </div>
      <div class="wk-b collapsed" id="wkb-${x.id}">${esc(x.body)}</div>
      <div style="padding:0 15px 12px">
        <button class="btn sm ghost no-print" data-act="toggleWk" data-id="${x.id}">展开全文</button>
        <span style="font-size:11px;color:var(--mute);margin-left:8px">生成于 ${esc(fmtTime(x.at))}</span>
      </div>
    </div>`).join('') ||
    `<div class="empty">还没有周报。点上面「生成 / 刷新本周周报」，或每周打开本工具时会自动生成。</div>`;

  return `
  <div class="sec-title">
    <h2>周报</h2>
    <span class="desc">按自然周自动汇总每日记录 · 可一键生成、AI 润色、导出归档</span>
  </div>

  ${autoWeeklyNotice ? `<div class="recov no-print">
    <span style="font-size:15px">🗒</span>
    <div>已自动为你生成 <b>${esc(autoWeeklyNotice)}</b> 的周报草稿（本工具跨周打开时自动生成，可在下方修改或删除）。
    在「数据保险箱」里可关闭自动生成。</div>
  </div>` : ''}

  <div class="grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:14px">
    <div class="kpi"><div class="k">本周记录</div><div class="v">${s.logs.length}</div><div class="m">覆盖 ${s.days} 天</div></div>
    <div class="kpi"><div class="k">本周完成测试项</div><div class="v">${s.doneItems.length}</div><div class="m">整体进度 ${s.o.pct}%</div></div>
    <div class="kpi ${(s.newIss.length + s.newBlk.length) ? 'alert' : 'ok'}"><div class="k">本周新增问题/阻碍</div><div class="v">${s.newIss.length + s.newBlk.length}</div><div class="m">仍有 ${s.openBlk.length + s.openIssue.length} 条未闭环</div></div>
    <div class="kpi ${s.critBugs.length ? 'alert' : 'ok'}"><div class="k">未关闭缺陷</div><div class="v">${s.openBugs.length}</div><div class="m">致命/严重 ${s.critBugs.length} 个</div></div>
  </div>

  <div class="card" style="margin-bottom:14px">
    <div class="card-h">
      <h3>${esc(w.key)} 本周周报</h3>
      <span class="sub">${esc(w.start)} ~ ${esc(w.end)}</span>
      <span class="right no-print">
        <button class="btn sm" data-act="genWeekly">生成 / 刷新</button>
        <button class="btn sm" data-act="aiWeekly">✨ AI 生成</button>
        <button class="btn sm" data-act="aiCfg">AI 接口设置</button>
        <button class="btn sm" data-act="dlWeeklyCur">导出 .md</button>
        <button class="btn sm" data-act="copyWeekly">复制</button>
      </span>
    </div>
    <div class="card-b">
      <textarea class="inp" id="wkBody" style="min-height:330px;font-size:12.5px;line-height:1.85">${esc(body)}</textarea>
      <div style="display:flex;gap:8px;margin-top:10px;align-items:center;flex-wrap:wrap">
        <button class="btn primary no-print" data-act="saveWeekly">保存本周周报</button>
        <span style="font-size:11px;color:var(--mute)">${cur
          ? '当前版本：' + esc(cur.by || '本地生成') + ' · ' + esc(fmtTime(cur.at))
          : '尚未保存，上面是实时预览（不改动你的记录）'}${dirHandle ? ' · 已绑定数据文件夹，导出时会同步写入 reports/' : ''}</span>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-h">
      <h3>历史周报</h3><span class="sub">${list.length} 份</span>
      <span class="right no-print">
        <label style="font-size:11.5px;color:var(--sub);display:flex;align-items:center;gap:5px">
          <input type="checkbox" ${S.backup.autoWeekly === false ? '' : 'checked'} data-act="toggleAutoWeekly"> 跨周自动生成
        </label>
      </span>
    </div>
    <div class="card-b">${hist}</div>
  </div>`;
}

/* =========================================================
   组长视图：组员进度一览
   ========================================================= */
const normName = s => String(s == null ? '' : s).trim().toLowerCase();
function memberAliases(m) {
  const extra = String(m.aliases || '').split(/[,，、;；|]/).map(x => x.trim()).filter(Boolean);
  return [m.name].concat(extra).map(normName).filter(Boolean);
}
function matchMember(name) {
  const n = normName(name);
  if (!n) return null;
  return S.members.find(m => memberAliases(m).indexOf(n) >= 0) || null;
}
const AVATAR_COLORS = ['#2f5cf6', '#0f9d58', '#d98012', '#7c4dff', '#0891b2', '#dc2f2f', '#5b8def', '#8a6d1f'];
function avatarColor(name) {
  let h = 0;
  const s = String(name || '?');
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 9973;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
function avatarText(name) {
  const s = String(name || '?').trim();
  return s.length <= 2 ? s : s.slice(-2);
}

function memberStats(m) {
  const al = memberAliases(m);
  const mine = nm => al.indexOf(normName(nm)) >= 0;
  const pairs = allItems().map(i => ({i, v: getItem(i.key)})).filter(x => mine(x.v.owner));
  const total = pairs.length;
  const done = pairs.filter(x => x.v.status === 'done').length;
  const doing = pairs.filter(x => x.v.status === 'doing').length;
  const blocked = pairs.filter(x => x.v.status === 'blocked').length;
  const pct = total ? Math.round(pairs.reduce((a, b) => a + (Number(b.v.progress) || 0), 0) / total) : 0;
  const logs = S.logs.filter(l => mine(l.author)).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const wk = weekRangeOf(today());
  const wkLogs = logs.filter(l => l.date >= wk.start && l.date <= wk.end);
  const iss = issuesAll().filter(x => {
    const l = S.logs.find(v => v.id === String(x.id).split('|')[0]);
    return l && mine(l.author);
  });
  const openIssue = iss.filter(x => !x.closed && x.kind === 'issue');
  const openBlk = iss.filter(x => !x.closed && x.kind === 'blocker');
  const bugs = S.bugs.filter(b => mine(b.owner));
  const bugOpen = bugs.filter(b => b.status !== '已关闭').length;
  const lastLog = logs[0] || null;

  const etaDays = m.eta ? Math.round(dayNum(m.eta) - dayNum(today())) : null;
  let status = {k: 'good', t: '正常'};
  if (blocked > 0 || openBlk.length > 0) status = {k: 'risk', t: '受阻'};
  else if (etaDays !== null && etaDays < 0 && pct < 100) status = {k: 'risk', t: '超期'};
  else if (etaDays !== null && etaDays <= 2 && pct < 90) status = {k: 'warn', t: '临期'};
  else if (total === 0 && logs.length === 0) status = {k: 'warn', t: '未关联'};
  else if (pct === 0 && total > 0) status = {k: 'warn', t: '未启动'};
  else if (bugOpen > 0) status = {k: 'warn', t: '有缺陷'};

  return {total, done, doing, blocked, pct, logs, wkLogs, openIssue, openBlk, bugs, bugOpen,
    lastLog, etaDays, status};
}

function memberFields(m) {
  m = m || {};
  return `
  <div class="grid" style="grid-template-columns:1fr 1fr;gap:10px">
    <div class="field"><label>姓名 <span style="color:var(--bad)">*</span></label>
      <input class="inp" id="mbName" value="${esc(m.name || '')}" placeholder="张三"></div>
    <div class="field"><label>角色</label>
      <input class="inp" id="mbRole" value="${esc(m.role || '')}" placeholder="测试工程师 / 射频 / 结构"></div>
  </div>
  <div class="grid" style="grid-template-columns:1fr 1fr;gap:10px;margin-top:10px">
    <div class="field"><label>负责模块</label>
      <input class="inp" id="mbModule" value="${esc(m.module || '')}" placeholder="内场 / 外场 / 软件平台"></div>
    <div class="field"><label>负责阶段</label>
      <select class="inp" id="mbStage">
        ${activeStages().map(s => `<option value="${s.id}" ${(m.stage || 'rd') === s.id ? 'selected' : ''}>${s.no} ${esc(s.name)}</option>`).join('')}
      </select></div>
  </div>
  <div class="field" style="margin-top:10px"><label>别名（用于自动匹配，多个用逗号分隔）</label>
    <input class="inp" id="mbAlias" value="${esc(m.aliases || '')}" placeholder="例：小张, ZhangSan, 张三"></div>
  <div class="grid" style="grid-template-columns:1fr 1fr;gap:10px;margin-top:10px">
    <div class="field"><label>预计完成时间</label>
      <input class="inp" type="date" id="mbEta" value="${esc(m.eta || '')}"></div>
    <div class="field"><label>当前一句话状态</label>
      <input class="inp" id="mbSummary" value="${esc(m.summary || '')}" placeholder="例：外场干扰测试进行中"></div>
  </div>
  <div class="field" style="margin-top:10px"><label>备注</label>
    <textarea class="inp" id="mbNote" style="min-height:52px">${esc(m.note || '')}</textarea></div>
  <div style="font-size:11px;color:var(--mute);margin-top:8px;line-height:1.6">
    关联方式：在「测试项台账」把负责人填成该组员姓名，或在「每日记录」填写记录人姓名，进度与问题会自动归到他名下。
  </div>`;
}

function renderTeam() {
  const wk = weekRangeOf(today());
  const rows = S.members.map(m => ({m, s: memberStats(m)}));
  const avg = rows.length ? Math.round(rows.reduce((a, b) => a + b.s.pct, 0) / rows.length) : 0;
  const riskN = rows.filter(r => r.s.status.k === 'risk').length;
  const activeN = rows.filter(r => r.s.wkLogs.length > 0).length;

  const table = rows.length ? `
    <div class="tblwrap"><table class="tbl">
      <thead><tr>
        <th style="width:110px">组员</th><th style="width:120px">角色 / 模块</th>
        <th style="width:90px">负责项</th><th style="width:130px">进度</th>
        ${isLeader() ? '<th style="width:80px">本周记录</th>' : ''}
        <th style="width:80px">未闭环问题</th>
        <th style="width:80px">未闭环阻碍</th><th style="width:120px">预计完成</th><th style="width:70px">状态</th>
      </tr></thead>
      <tbody>
      ${rows.map(r => `
        <tr>
          <td style="font-weight:700">${esc(r.m.name)}</td>
          <td style="font-size:11.5px;color:var(--sub)">${esc([r.m.role, r.m.module].filter(Boolean).join(' · ') || '—')}</td>
          <td>${r.s.done}/${r.s.total}</td>
          <td><div style="display:flex;align-items:center;gap:6px">
            <div class="bar ${r.s.pct === 100 ? 'g' : r.s.blocked ? 'r' : ''}" style="width:74px"><i style="width:${r.s.pct}%"></i></div>
            <span style="font-size:11.5px">${r.s.pct}%</span></div></td>
          ${isLeader() ? `<td>${r.s.wkLogs.length}</td>` : ''}
          <td style="color:${r.s.openIssue.length ? 'var(--bad)' : 'var(--mute)'}">${r.s.openIssue.length}</td>
          <td style="color:${r.s.openBlk.length ? 'var(--bad)' : 'var(--mute)'}">${r.s.openBlk.length}</td>
          <td>${r.m.eta ? `<span style="color:${r.s.etaDays !== null && r.s.etaDays < 0 && r.s.pct < 100 ? 'var(--bad)' : 'var(--ink2)'}">${esc(r.m.eta)}</span>` : '<span style="color:var(--mute)">未设置</span>'}</td>
          <td><span class="tag ${r.s.status.k === 'risk' ? 'r' : r.s.status.k === 'warn' ? 'o' : 'g'}">${r.s.status.t}</span></td>
        </tr>`).join('')}
      </tbody>
    </table></div>` : `<div class="empty">${isLeader()
      ? '还没有组员。点右上角「＋ 添加组员」，或用「自动识别组员」从已有记录与台账里导入。'
      : '组长还没有登记组员档案。组员档案登记后，这里会显示每个人的进度与阻碍概览。'}</div>`;

  const cards = rows.map(r => {
    const st = r.s;
    /* 组员看他人：只开放「项目总览进度 + 问题阻碍点 + 资源申请（日期/时段）」三项 */
    if (!isLeader() && !iAm(r.m.name)) {
      const myRes = resReqs().filter(x => normName(x.applicant) === normName(r.m.name))
        .sort((a, b) => (a.date || '').localeCompare(b.date || '')).slice(0, 3);
      const blks = st.openBlk.concat(st.openIssue).slice(0, 3);
      return `<div class="memcard ro">
        <div class="mtop">
          <div class="avt" style="background:${avatarColor(r.m.name)}">${esc(avatarText(r.m.name))}</div>
          <div style="min-width:0">
            <div class="mnm">${esc(r.m.name)} <span class="tag m">只读</span></div>
            <div class="mrl">${esc([r.m.role, r.m.module].filter(Boolean).join(' · ') || '未填写角色')}</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <div class="bar ${st.pct === 100 ? 'g' : ''}" style="flex:1"><i style="width:${st.pct}%"></i></div>
          <b style="font-size:12.5px;min-width:38px;text-align:right">${st.pct}%</b>
        </div>
        <div class="mlines">
          ${blks.length ? blks.map(x => `<div class="mline"><span class="dotk" style="color:${x.kind === 'blocker' ? '#a35c05' : '#b3261e'}">${x.kind === 'blocker' ? '阻碍' : '问题'}</span><span>${esc(x.text)}</span></div>`).join('')
            : '<div class="mline" style="color:var(--mute)">暂无未闭环的问题 / 阻碍</div>'}
        </div>
        <div class="minfo" style="margin-top:2px">
          <div><b>${st.pct}%</b><span>总览进度</span></div>
          <div><b style="color:${blks.length ? 'var(--warn)' : 'inherit'}">${blks.length}</b><span>未闭环阻碍 / 问题</span></div>
          <div><b>${myRes.length}</b><span>近期资源申请</span></div>
        </div>
        ${myRes.length ? `<div class="mlines" style="margin-top:8px">${myRes.map(x => {
          const t = resTypeById(x.typeId) || {name:'资源', unit:'', icon:'📦'};
          return `<div class="mline"><span class="dotk" style="color:var(--sub)">${esc(t.icon)} 申请</span><span>${esc(x.date)} ${esc(x.start)}~${esc(x.end)} · ${esc(t.name)} ${x.qty}${esc(t.unit)}${x.purpose ? '（' + esc(x.purpose) + '）' : ''}</span></div>`;
        }).join('')}</div>` : ''}
      </div>`;
    }
    const lines = [];
    if (st.lastLog && st.lastLog.done) lines.push(`<div class="mline"><span class="dotk" style="color:var(--ok)">进展</span><span>${esc(firstLine(st.lastLog.done))}</span></div>`);
    st.openBlk.slice(0, 2).forEach(x => lines.push(`<div class="mline"><span class="dotk" style="color:#a35c05">阻碍</span><span>${esc(x.text)}</span></div>`));
    st.openIssue.slice(0, 2).forEach(x => lines.push(`<div class="mline"><span class="dotk" style="color:#b3261e">问题</span><span>${esc(x.text)}</span></div>`));
    if (st.lastLog && st.lastLog.plan) lines.push(`<div class="mline"><span class="dotk" style="color:var(--sub)">计划</span><span>${esc(firstLine(st.lastLog.plan))}</span></div>`);
    if (st.blocked) lines.push(`<div class="mline"><span class="dotk" style="color:var(--bad)">阻塞</span><span>${st.blocked} 个测试项处于阻塞状态</span></div>`);
    if (!lines.length) lines.push(`<div class="mline" style="color:var(--mute)">暂无记录或负责项</div>`);

    return `<div class="memcard ${st.status.k === 'risk' ? 'risk' : st.status.k === 'warn' ? 'warn' : ''}">
      <div class="mtop">
        <div class="avt" style="background:${avatarColor(r.m.name)}">${esc(avatarText(r.m.name))}</div>
        <div style="min-width:0">
          <div class="mnm">${esc(r.m.name)}
            <span class="tag ${st.status.k === 'risk' ? 'r' : st.status.k === 'warn' ? 'o' : 'g'}">${st.status.t}</span></div>
          <div class="mrl">${esc([r.m.role, r.m.module].filter(Boolean).join(' · ') || '未填写角色')} · ${esc(stageById(r.m.stage || 'rd').name)}</div>
        </div>
        <div class="mstat no-print">
          <button class="btn sm ghost" data-act="editMember" data-id="${r.m.id}">编辑</button>
        </div>
      </div>

      <div style="display:flex;align-items:center;gap:8px">
        <div class="bar ${st.pct === 100 ? 'g' : st.blocked ? 'r' : ''}" style="flex:1"><i style="width:${st.pct}%"></i></div>
        <b style="font-size:12.5px;min-width:38px;text-align:right">${st.pct}%</b>
      </div>

      <div class="minfo">
        <div><b>${st.done}/${st.total}</b><span>测试项完成</span></div>
        <div><b>${st.wkLogs.length}</b><span>本周记录</span></div>
        <div><b style="color:${st.bugOpen ? 'var(--warn)' : 'inherit'}">${st.bugOpen}</b><span>未关闭缺陷</span></div>
      </div>

      <div class="mlines">${lines.join('')}</div>

      <div class="eta">
        <span>预计完成</span>
        ${isLeader() ? `<input type="date" value="${esc(r.m.eta || '')}" data-act="setEta" data-id="${r.m.id}">`
          : `<b>${esc(r.m.eta || '未设置')}</b>`}
        ${st.etaDays !== null ? `<span style="color:${st.etaDays < 0 ? 'var(--bad)' : st.etaDays <= 2 ? 'var(--warn)' : 'var(--mute)'}">
          ${st.etaDays < 0 ? '已超期 ' + Math.abs(st.etaDays) + ' 天' : st.etaDays === 0 ? '今天到期' : '剩 ' + st.etaDays + ' 天'}</span>` : ''}
        ${st.lastLog ? `<span style="margin-left:auto;color:var(--mute)">最近记录 ${esc(st.lastLog.date)}</span>` : ''}
      </div>
    </div>`;
  }).join('');

  // 未关联姓名提示
  const names = new Set();
  S.logs.forEach(l => { if (l.author && !matchMember(l.author)) names.add(l.author.trim()); });
  allItems().forEach(i => { const v = getItem(i.key); if (v.owner && !matchMember(v.owner)) names.add(v.owner.trim()); });
  const unknown = Array.from(names).filter(Boolean);

  return `
  <div class="sec-title">
    <h2>组员进度</h2>
    <span class="desc">${isLeader()
      ? '组长视图：一屏看清每个人的进度、问题阻碍与预计完成时间'
      : '组员视图：他人仅开放「总览进度 + 问题阻碍 + 资源申请」，你的内容可编辑'}</span>
    <span class="right no-print" style="margin-left:auto;display:flex;gap:6px">
      ${isLeader() ? '<button class="btn sm" data-act="scanMembers">自动识别组员</button>' : ''}
      <button class="btn sm" data-act="exportTeamCsv">导出 CSV</button>
      ${isLeader() ? '<button class="btn sm primary" data-act="addMember">＋ 添加组员</button>' : ''}
    </span>
  </div>

  <div class="grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:14px">
    <div class="kpi"><div class="k">组员数</div><div class="v">${rows.length}</div><div class="m">本周有记录 ${activeN} 人</div></div>
    <div class="kpi"><div class="k">团队平均进度</div><div class="v">${avg}<small>%</small></div><div class="m">按负责测试项加权</div></div>
    <div class="kpi ${riskN ? 'alert' : 'ok'}"><div class="k">受阻 / 超期</div><div class="v">${riskN}</div><div class="m">需要组长介入协调</div></div>
    <div class="kpi"><div class="k">本周团队记录</div><div class="v">${rows.reduce((a, b) => a + b.s.wkLogs.length, 0)}</div><div class="m">${wk.start} ~ ${wk.end}</div></div>
  </div>

  <div class="card" style="margin-bottom:14px">
    <div class="card-h"><h3>团队进度总表</h3><span class="sub">可直接对照汇报</span></div>
    <div class="card-b">${table}</div>
  </div>

  ${unknown.length ? `<div class="recov no-print">
    <span style="font-size:15px">👤</span>
    <div>这些姓名出现在记录 / 台账里，但还没有建为组员：
      <b>${esc(unknown.join('、'))}</b>
      <button class="btn sm" data-act="scanMembers" style="margin-left:8px">一键建为组员</button>
    </div>
  </div>` : ''}

  ${rows.length ? `<div class="grid" style="grid-template-columns:repeat(2,1fr)">${cards}</div>`
    : `<div class="card"><div class="card-b"><div class="empty">添加组员后，这里会显示每个人的进度卡片：完成项数、本周记录、未闭环问题与阻碍、预计完成时间。</div></div></div>`}`;
}

/* =========================================================
   数据保险箱：自动备份 / 快照回滚 / 数据文件夹
   ========================================================= */
function renderVault() {
  const snaps = snapList();
  const b = S.backup || {};
  const kb = n => (n / 1024).toFixed(1) + ' KB';

  const crashBox = (crashFlag || recoveredFlag || storageLow) ? `<div class="recov">
    <span style="font-size:15px">${storageLow ? '💾' : '⚠️'}</span>
    <div>
      ${storageLow
        ? '<b>浏览器存储空间不足，最新改动暂存在内存里，刷新会丢失。</b>请先「JSON 备份」导出一份，再点下方「清理存储」释放空间（v4.1 起快照已改存 IndexedDB，正常不会再出现此提示）。'
        : recoveredFlag
          ? '<b>检测到主数据损坏，已自动用最新快照恢复。</b>请确认内容无误后继续操作；如不对，可在下方「自动快照」里选择更早的一份回滚。'
          : '<b>检测到上次不是正常退出（程序卡死 / 强制关闭 / 断电）。</b>你的数据已在自动快照中保留，下方列表可随时回滚到任意时间点。'}
    </div>
  </div>` : '';

  const folderCard = `
    <div class="card" style="margin-bottom:14px">
      <div class="card-h">
        <h3>数据文件夹</h3>
        <span class="sub">${FS_OK ? '浏览器支持直连' : '当前浏览器不支持直连'}</span>
        <span class="right no-print">
          ${dirHandle ? `<button class="btn sm" data-act="syncNow">立即写入</button>
            <button class="btn sm" data-act="loadFromFolder">从文件夹恢复</button>
            <button class="btn sm danger" data-act="unbindFolder">解绑</button>`
            : `<button class="btn sm primary" data-act="${b.pending ? 'reauthFolder' : 'bindFolder'}">${b.pending ? '重新连接：' + esc(b.pending) : '绑定数据文件夹'}</button>`}
        </span>
      </div>
      <div class="card-b">
        ${dirHandle ? `
          <div class="pathbox">已绑定：<b>${esc(b.folder || '')}</b>${b.lastFolder ? ' · 上次写入 ' + esc(fmtTime(b.lastFolder)) : ''}</div>
          <div class="tree" style="margin-top:10px">
            ${esc(b.folder || '数据文件夹')}/<br>
            ├─ workspace.json　　　全部项目主数据（每次改动自动同步）<br>
            ├─ projects/　　　　　各项目单独一份 JSON<br>
            ├─ backups/　　　　　　自动快照（滚动保留 ${b.keep || 12} 份）<br>
            ├─ reports/　　　　　　导出的周报 .md<br>
            └─ exports/　　　　　　导出的台账 / 缺陷 CSV
          </div>`
          : `<div style="font-size:12.5px;color:var(--ink2);line-height:1.85">
            绑定一个真实磁盘文件夹后，本看板会把数据<b>自动写进这个文件夹</b>，形成独立的数据目录：<br>
            <div class="tree" style="margin:8px 0 10px">
              测试看板数据/<br>
              ├─ workspace.json　全部项目主数据（自动同步）<br>
              ├─ projects/　　　　各项目单独 JSON<br>
              ├─ backups/　　　　自动快照（滚动保留 ${b.keep || 12} 份）<br>
              ├─ reports/　　　　周报 .md<br>
              └─ exports/　　　　台账 / 缺陷 CSV
            </div>
            ${FS_OK ? '建议就在本看板文件旁边新建「测试看板数据」文件夹并选中它。'
              : '当前浏览器不支持自动写入文件夹（仅 Chrome / Edge 支持），请用下方「JSON 备份」手动保存到该文件夹，效果相同。'}
          </div>`}
        <div style="font-size:11px;color:var(--mute);margin-top:10px;line-height:1.7">
          提示：浏览器出于安全考虑，重新打开文件时可能需要点一次「允许」才能继续写入，点上面的「重新连接」即可。
        </div>
      </div>
    </div>`;

  const snapRows = snaps.length ? snaps.map((x, i) => {
    let recN = '?';
    try { recN = (JSON.parse(x.json).logs || []).length; } catch (e) {}
    return `
    <div class="snap">
      <div>
        <div class="st">${esc(fmtTime(x.t))}</div>
        <div class="sm">${esc(x.reason)}快照 · ${kb(x.size)} · ${recN} 条记录${i === 0 ? ' · <b style="color:var(--ok)">最新</b>' : ''}</div>
      </div>
      <div class="sbtn no-print">
        <button class="btn sm ghost" data-act="restoreSnap" data-t="${x.t}">回滚到这里</button>
        <button class="btn sm ghost" data-act="dlSnap" data-t="${x.t}">下载</button>
      </div>
    </div>`;
  }).join('')
    : `<div class="empty">还没有自动快照。随便改动一点内容或等待 ${b.interval || 3} 分钟，这里就会出现第一份。</div>`;

  return `
  <div class="sec-title">
    <h2>数据保险箱</h2>
    <span class="desc">自动备份 · 崩溃可回滚 · 数据文件夹独立存放</span>
  </div>

  ${crashBox}

  <div class="grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:14px">
    <div class="kpi ok"><div class="k">自动备份</div><div class="v" style="font-size:20px">${b.auto === false ? '已关闭' : '开启'}</div><div class="m">每 ${b.interval || 3} 分钟落一次盘</div></div>
    <div class="kpi"><div class="k">本地快照</div><div class="v">${snaps.length}</div><div class="m">最多保留 ${b.keep || 12} 份</div></div>
    <div class="kpi"><div class="k">最近快照</div><div class="v" style="font-size:15px;line-height:1.5">${snaps.length ? esc(fmtTime(snaps[0].t)) : '—'}</div><div class="m">${snaps.length ? esc(snaps[0].reason) : '暂无'}</div></div>
    <div class="kpi ${dirHandle ? 'ok' : ''}"><div class="k">数据文件夹</div><div class="v" style="font-size:15px;line-height:1.5">${dirHandle ? esc(b.folder || '已绑定') : '未绑定'}</div><div class="m">${dirHandle ? '改动自动写入磁盘' : '仅浏览器内备份'}</div></div>
  </div>

  ${folderCard}

  <div class="card" style="margin-bottom:14px">
    <div class="card-h">
      <h3>存储空间</h3>
      <span class="sub">${storageQuota
        ? '浏览器报告：已用 ' + kb(storageQuota.used) + ' / 配额 ' + kb(storageQuota.quota)
        : '本页估算（浏览器为本地文件页分配约 5MB，同源所有页面共享）'}</span>
      <span class="right no-print">
        <button class="btn sm" data-act="purgeStorage">清理存储</button>
      </span>
    </div>
    <div class="card-b">
      ${(() => {
        const u = storageUsage();
        const quota = storageQuota ? storageQuota.quota : 5 * 1024 * 1024;
        const used = storageQuota ? storageQuota.used : u.total;
        const pct = clamp(Math.round(used / quota * 100), 0, 100);
        const cls = pct > 85 ? 'r' : pct > 60 ? 'o' : 'g';
        return `
        <div style="display:flex;align-items:center;gap:10px">
          <div class="bar lg ${cls}" style="flex:1"><i style="width:${pct}%"></i></div>
          <b style="font-size:12.5px;min-width:88px;text-align:right">${kb(used)} / ${kb(quota)}</b>
        </div>
        <div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:9px;font-size:11.5px;color:var(--sub)">
          <span>主数据+草稿等 <b>${kb(u.mine)}</b></span>
          <span>快照占用 <b>${kb(u.snapBytes)}</b>（存于${idbBroken ? '浏览器存储' : 'IndexedDB · gzip 压缩'}）</span>
          <span>快照份数 <b>${snapList().length}</b></span>
        </div>
        ${pct > 85 ? '<div style="font-size:11.5px;color:var(--bad);margin-top:8px">空间紧张：建议先「JSON 备份」再点「清理存储」。</div>' : ''}`;
      })()}
    </div>
  </div>

  <div class="split">
    <div>
      <div class="card">
        <div class="card-h">
          <h3>自动快照</h3><span class="sub">${snaps.length} 份 · ${idbBroken ? '存于浏览器存储' : '存于 IndexedDB · gzip 压缩'} · 防止卡死 / 断电 / 误删</span>
          <span class="right no-print">
            <button class="btn sm" data-act="snapNow">立即存一份</button>
            <button class="btn sm" data-act="clearSnaps">清理</button>
          </span>
        </div>
        <div class="card-b" style="max-height:420px;overflow:auto">${snapRows}</div>
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="card">
        <div class="card-h"><h3>备份设置</h3></div>
        <div class="card-b">
          <label style="display:flex;align-items:center;gap:7px;font-size:12.5px;margin-bottom:10px">
            <input type="checkbox" ${b.auto === false ? '' : 'checked'} data-act="setBackupAuto"> 开启自动备份
          </label>
          <div class="field"><label>自动备份间隔（分钟）</label>
            <input class="inp" type="number" min="1" max="60" value="${b.interval || 3}" data-act="setBackupInterval"></div>
          <div class="field" style="margin-top:10px"><label>最多保留快照份数</label>
            <input class="inp" type="number" min="3" max="60" value="${b.keep || 12}" data-act="setBackupKeep"></div>
          <label style="display:flex;align-items:center;gap:7px;font-size:12.5px;margin-top:10px">
            <input type="checkbox" ${b.autoWeekly === false ? '' : 'checked'} data-act="toggleAutoWeekly"> 跨周自动生成周报
          </label>
          <div class="hr"></div>
          <div style="display:flex;gap:6px;flex-wrap:wrap" class="no-print">
            <button class="btn sm" data-act="exportJsonBtn">JSON 备份</button>
            <button class="btn sm" data-act="exportShareData">导出含数据分享版</button>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-h"><h3>三重保护说明</h3></div>
        <div class="card-b" style="font-size:12px;color:var(--ink2);line-height:1.9">
          <b>① 实时落盘</b>：每次改动 0.1 秒内写入浏览器本地存储。<br>
          <b>② 自动快照</b>：每 ${b.interval || 3} 分钟 + 每次退出前自动存一份完整快照，存于 <b>IndexedDB（gzip 压缩）</b>，不再挤占 5MB 配额，可回滚到任意一份。<br>
          <b>③ 数据文件夹</b>：绑定后同步写入真实磁盘目录，换电脑、重装系统都不怕。<br>
          <b>外加：</b>每日记录写到一半也会自动存草稿，卡死重开仍在。
        </div>
      </div>

      <div class="card">
        <div class="card-h"><h3>危险操作</h3></div>
        <div class="card-b">
          <button class="btn danger sm no-print" data-act="resetAll">删除当前项目</button>
          <div style="font-size:11px;color:var(--mute);margin-top:8px;line-height:1.6">
            清空前建议先做一次 JSON 备份；清空后仍可从下方快照回滚（快照不会被清空）。
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

/* =========================================================
   视图：汇总报告
   ========================================================= */
function renderReport() {
  const o = overall(), b = bugStat(), h = health(), m = S.meta;
  const logs = S.logs.slice().sort((a2, b2) => (b2.date || '').localeCompare(a2.date || ''));
  const iss = issuesAll(), res = resourceAll();
  const rounds = S.rounds.slice().sort((a2, b2) => (b2.date || '').localeCompare(a2.date || ''));

  const stageTable = activeStages().map(st => {
    const s = stageStat(st), g = stageGate(st), d = S.stageDates[st.id] || {};
    return `<tr>
      <td style="font-weight:700">${st.no}</td>
      <td style="font-weight:600">${esc(st.name)}</td>
      <td style="font-size:11px;color:var(--sub)">${d.start ? esc(d.start) + ' ~ ' + esc(d.end || '') : '未排期'}</td>
      <td>${s.done}/${s.total}</td>
      <td><div style="display:flex;align-items:center;gap:6px"><div class="bar ${s.pct === 100 ? 'g' : s.blocked ? 'r' : ''}" style="width:64px"><i style="width:${s.pct}%"></i></div>${s.pct}%</div></td>
      <td>${g.done}/${g.total}</td>
      <td style="color:${g.done === g.total ? 'var(--ok)' : 'var(--mute)'}">${g.done === g.total ? '准出' : '未准出'}</td>
    </tr>`;
  }).join('');

  const resultStat = {};
  RESULTS.slice(1).forEach(r => resultStat[r] = 0);
  allItems().forEach(i => { const v = getItem(i.key); if (v.result) resultStat[v.result] = (resultStat[v.result] || 0) + 1; });

  const mPass = S.matrix.filter(x => x.conclusion === '通过').length;
  const mFail = S.matrix.filter(x => x.conclusion === '不通过').length;

  return `
  <div class="sec-title no-print">
    <h2>汇总报告</h2>
    <span class="desc">给上级看的一页纸 · 可直接打印或另存 PDF</span>
    <button class="btn primary" style="margin-left:auto" data-act="print">打印 / 导出 PDF</button>
  </div>

  <div class="card" style="padding:22px 26px;margin-bottom:14px">
    <div style="display:flex;align-items:flex-start;gap:20px;flex-wrap:wrap">
      <div style="flex:1;min-width:240px">
        <div style="display:flex;align-items:center;gap:9px;flex-wrap:wrap">
          <div style="font-size:19px;font-weight:750;letter-spacing:-.3px">${esc(m.name)} · 测试进度报告</div>
          <span class="health ${h.k}"><i></i>${esc(h.t)}</span>
        </div>
        <div style="font-size:11.5px;color:var(--mute);margin-top:4px">生成时间 ${new Date().toLocaleString('zh-CN', {hour12:false})} · ${esc(h.rs)}</div>
        <div style="display:grid;grid-template-columns:repeat(3,auto);gap:6px 24px;margin-top:14px;font-size:12px">
          <div><span style="color:var(--mute)">样机型号：</span>${esc(m.model || '—')}</div>
          <div><span style="color:var(--mute)">规格版本：</span>${esc(m.spec || '—')}</div>
          <div><span style="color:var(--mute)">测试周期：</span>${esc(m.period || '—')}</div>
          <div><span style="color:var(--mute)">测试负责人：</span>${esc(m.owner || '—')}</div>
          <div><span style="color:var(--mute)">项目经理：</span>${esc(m.pm || '—')}</div>
          <div><span style="color:var(--mute)">测试轮次：</span>${rounds.length} 轮</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:5px">${ring(o.pct, 96)}</div>
    </div>
  </div>

  <div class="card" style="margin-bottom:14px">
    <div class="card-h"><h3>一、阶段准出总览</h3><span class="sub">本项目 ${activeStages().length} 个阶段 · ${activeStages().filter(gateReady).length} 个门禁就绪</span></div>
    <table class="tbl">
      <thead><tr><th>编号</th><th>阶段</th><th>计划周期</th><th>测试项</th><th>进度</th><th>门禁</th><th>状态</th></tr></thead>
      <tbody>${stageTable}</tbody>
    </table>
  </div>

  <div class="split" style="margin-bottom:14px">
    <div class="card">
      <div class="card-h"><h3>二、测试项与缺陷</h3></div>
      <div class="card-b">
        <div class="grid" style="grid-template-columns:repeat(2,1fr);gap:10px">
          <div style="display:flex;justify-content:space-between;font-size:12.5px;padding:6px 0;border-bottom:1px dashed var(--line2)"><span>测试项总数</span><b>${o.total}</b></div>
          <div style="display:flex;justify-content:space-between;font-size:12.5px;padding:6px 0;border-bottom:1px dashed var(--line2)"><span>已完成</span><b style="color:var(--ok)">${o.done}</b></div>
          <div style="display:flex;justify-content:space-between;font-size:12.5px;padding:6px 0;border-bottom:1px dashed var(--line2)"><span>进行中</span><b style="color:var(--brand)">${o.doing}</b></div>
          <div style="display:flex;justify-content:space-between;font-size:12.5px;padding:6px 0;border-bottom:1px dashed var(--line2)"><span>阻塞</span><b style="color:var(--bad)">${o.blocked}</b></div>
          <div style="display:flex;justify-content:space-between;font-size:12.5px;padding:6px 0;border-bottom:1px dashed var(--line2)"><span>缺陷总数 / 未关闭</span><b>${b.total} / ${b.open}</b></div>
          <div style="display:flex;justify-content:space-between;font-size:12.5px;padding:6px 0;border-bottom:1px dashed var(--line2)"><span>致命+严重未关闭</span><b style="color:var(--bad)">${b.crit}</b></div>
        </div>
        <div class="hr"></div>
        <div style="font-size:11.5px;color:var(--sub);line-height:2">
          ${RESULTS.slice(1).map(r => `<span style="margin-right:16px">${r}：<b style="color:var(--ink)">${resultStat[r] || 0}</b> 项</span>`).join('')}
        </div>
        <div style="font-size:11.5px;color:var(--sub);margin-top:6px">
          指标追溯：${S.matrix.length} 项指标，通过 <b style="color:var(--ok)">${mPass}</b>，不通过 <b style="color:var(--bad)">${mFail}</b>，其余待判定。
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-h"><h3>三、风险与待办</h3></div>
      <div class="card-b">
        <div class="mini-lbl">未闭环阻碍（${iss.filter(x => x.kind === 'blocker' && !x.closed).length}）</div>
        ${iss.filter(x => x.kind === 'blocker' && !x.closed).slice(0, 6).map(x => `<div style="font-size:12px;padding:3px 0;color:#a35c05">· ${esc(x.text)}</div>`).join('') || '<div style="font-size:12px;color:var(--mute)">无</div>'}
        <div class="mini-lbl">未闭环问题（${iss.filter(x => x.kind === 'issue' && !x.closed).length}）</div>
        ${iss.filter(x => x.kind === 'issue' && !x.closed).slice(0, 8).map(x => `<div style="font-size:12px;padding:3px 0;color:#b3261e">· ${esc(x.text)}</div>`).join('') || '<div style="font-size:12px;color:var(--mute)">无</div>'}
        <div class="mini-lbl">严重缺陷（${S.bugs.filter(x => (x.sev === 's1' || x.sev === 's2') && x.status !== '已关闭').length}）</div>
        ${S.bugs.filter(x => (x.sev === 's1' || x.sev === 's2') && x.status !== '已关闭').slice(0, 6).map(x => `<div style="font-size:12px;padding:3px 0">${sevTag(x.sev)} ${esc(x.no)} ${esc(x.title)}</div>`).join('') || '<div style="font-size:12px;color:var(--mute)">无</div>'}
        <div class="mini-lbl">待落实资源（${res.filter(x => !x.closed).length}）</div>
        ${res.filter(x => !x.closed).slice(0, 5).map(x => `<div style="font-size:12px;padding:3px 0;color:#5b2fd6">· ${esc(x.text)}</div>`).join('') || '<div style="font-size:12px;color:var(--mute)">无</div>'}
      </div>
    </div>
  </div>

  ${rounds.length ? `<div class="card" style="margin-bottom:14px">
    <div class="card-h"><h3>四、版本轮次</h3><span class="sub">共 ${rounds.length} 轮</span></div>
    <table class="tbl">
      <thead><tr><th>版本</th><th>构建日期</th><th>类型</th><th>变更内容</th><th>回归范围</th><th>结论</th></tr></thead>
      <tbody>${rounds.slice(0, 8).map(r => `<tr>
        <td style="font-weight:700">${esc(r.version)}</td>
        <td style="font-size:11.5px">${esc(r.date)}</td>
        <td style="font-size:11.5px">${esc(r.type)}</td>
        <td style="font-size:11.5px">${esc((r.scope || '').slice(0, 60))}</td>
        <td style="font-size:11.5px">${esc((r.regress || '').slice(0, 60))}</td>
        <td><span class="tag ${r.conclusion === '通过' ? 'g' : r.conclusion === '不通过（打回研发）' ? 'r' : r.conclusion ? 'o' : 'm'}">${esc(r.conclusion || '未出结论')}</span></td>
      </tr>`).join('')}</tbody>
    </table>
  </div>` : ''}

  <div class="card" style="margin-bottom:14px">
    <div class="card-h"><h3>五、近期记录</h3><span class="sub">最近 6 条</span></div>
    <div class="card-b">
      ${logs.slice(0, 6).map(l => `<div style="padding:8px 0;border-bottom:1px dashed var(--line2);font-size:12px">
        <b>${esc(l.date)}</b> <span class="tag m" style="margin:0 6px">${esc(stageById(l.stage).name)}</span>
        <span style="color:var(--ink2)">${esc((l.done || '').slice(0, 120))}</span>
      </div>`).join('') || '<div class="empty">暂无记录</div>'}
    </div>
  </div>

  <div class="card" style="padding:18px 24px">
    <div style="font-size:11.5px;color:var(--mute);margin-bottom:10px">
      本报告结论基于台账实际记录与原始证据；判定独立于项目组说辞，偏差项须书面审批后方可判定通过。
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;font-size:12px;color:var(--sub)">
      <div>测试负责人签署：<span style="display:inline-block;width:90px;border-bottom:1px solid #c9d4e8;margin-left:6px"></span></div>
      <div>审　核：<span style="display:inline-block;width:90px;border-bottom:1px solid #c9d4e8;margin-left:6px"></span></div>
      <div>日　期：<span style="display:inline-block;width:90px;border-bottom:1px solid #c9d4e8;margin-left:6px"></span></div>
    </div>
  </div>`;
}

/* =========================================================
   交互
   ========================================================= */
let focusQ = null, dragBug = null;

function openMetaModal() {
  const m = S.meta;
  openModal('项目信息', `
    <div class="field"><label>项目名称</label><input class="inp" id="pName" value="${esc(m.name)}" placeholder="例：XX 型反无人机系统 测试项目"></div>
    <div class="grid" style="grid-template-columns:1fr 1fr;gap:12px;margin-top:12px">
      <div class="field"><label>样机型号</label><input class="inp" id="pModel" value="${esc(m.model)}"></div>
      <div class="field"><label>规格书版本</label><input class="inp" id="pSpec" value="${esc(m.spec)}"></div>
      <div class="field"><label>测试负责人</label><input class="inp" id="pOwner" value="${esc(m.owner)}"></div>
      <div class="field"><label>项目经理</label><input class="inp" id="pPm" value="${esc(m.pm)}"></div>
    </div>
    <div class="field" style="margin-top:12px"><label>测试周期</label><input class="inp" id="pPeriod" value="${esc(m.period)}" placeholder="2026-11-01 ~ 2026-12-31"></div>
    <div class="field" style="margin-top:12px">
      <label>下发任务类型（由直属领导 / 项目任务单决定，通常只有一类）</label>
      <div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:6px">
        ${PAR_TRACKS.map(id => {
          const st = stageById(id), on = trackOn(id);
          return `<label class="chk ${on ? 'done' : ''}" style="margin:0">
            <input type="checkbox" data-act="metaTrack" data-id="${id}" ${on ? 'checked' : ''}>
            <span>${esc(st.name)}</span>
          </label>`;
        }).join('')}
      </div>
      <div style="font-size:11px;color:var(--mute);margin-top:6px;line-height:1.6">未勾选表示本项目未下发该类任务：不进入流程、不计入整体进度与门禁依赖（已填数据保留，随时可恢复）。</div>
    </div>
    <div class="field" style="margin-top:12px"><label>下发依据</label>
      <input class="inp" id="pTaskDoc" value="${esc(m.taskDoc || '')}" placeholder="任务单号 / 下发人 / 下发日期"></div>
    <div class="hr"></div>
    <div style="display:flex;gap:8px;align-items:center">
      <div style="flex:1;font-size:11.5px;color:var(--mute);line-height:1.6">数据保存在当前浏览器，各项目相互独立。换电脑或要给别人用，先「分享 / 导出」备份 JSON（含全部项目），再到新环境「导入」。</div>
      <button class="btn danger sm" data-act="resetAll">删除当前项目</button>
    </div>
  `, `<button class="btn" data-close>取消</button><button class="btn primary" data-act="saveMeta">保存</button>`);
}

function csvCell(v) {
  v = String(v == null ? '' : v);
  return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
}

/* ---------- 复制 / 周报导出 ---------- */
function fallbackCopy(t, cb) {
  const ta = document.createElement('textarea');
  ta.value = t; ta.style.position = 'fixed'; ta.style.top = '-100px'; ta.style.opacity = '0';
  document.body.appendChild(ta); ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch (e) {}
  ta.remove();
  ok ? cb() : toast('复制失败，请手动选中后按 Ctrl+C');
}
function copyText(t) {
  if (!t) { toast('没有可复制的内容'); return; }
  const done = () => toast('已复制到剪贴板');
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(t).then(done, () => fallbackCopy(t, done));
      return;
    }
  } catch (e) {}
  fallbackCopy(t, done);
}
async function exportWeeklyFile(w, text) {
  const safe = (S.meta.name || '测试项目').replace(/[\\/:*?"<>|]/g, '');
  const name = `周报_${safe}_${w.key}.md`;
  const md = `# ${S.meta.name || '测试项目'} · ${w.key} 周报\n\n周期：${w.start} ~ ${w.end}\n生成时间：${fmtTime(Date.now())}\n\n${text}\n`;
  if (dirHandle) {
    try {
      await writeIn(await subDir(dirHandle, 'reports'), name, md);
      toast('已写入数据文件夹 reports/' + name);
      return;
    } catch (e) {}
  }
  download(md, name, 'text/markdown;charset=utf-8');
  toast('周报已导出为 .md');
}

/* =========================================================
   分享 / 导出分发文件
   ========================================================= */
/** 把当前数据嵌入 HTML 本体，生成一个自包含的分发文件 */
function exportShare(withData) {
  let html = RAW_HTML;
  if (withData) {
    const json = JSON.stringify(S)
      .replace(/<\//g, '<\\/')      // 转义结束标签，避免提前闭合脚本块
      .replace(/<\!--/g, '<\\!--'); // 转义注释起始，避免触发 HTML 解析器转义状态
    // 用 \x3C 拼接标签，源码中不出现字面 script 标签
    const inject = '\x3Cscript>window.EMBEDDED_DATA=' + json + ';\x3C/script>';
    html = html.replace('<body>', '<body>\n' + inject);
    if (html.indexOf('EMBEDDED_DATA') < 0) { toast('导出失败：无法写入数据'); return; }
  }
  const name = withData
    ? `测试项目看板_含数据_${(S.meta.name || '项目').replace(/[\\/:*?"<>|]/g, '')}_${today()}.html`
    : '测试项目看板_空白模板.html';
  download(html, name, 'text/html;charset=utf-8');
  toast(withData ? '已导出含当前数据的分享文件' : '已导出空白模板');
}

function shareCard(title, desc, act, primary) {
  return `<button class="btn ${primary ? 'primary' : ''}" data-act="${act}"
    style="flex-direction:column;align-items:flex-start;gap:4px;padding:12px 14px;text-align:left;height:auto">
    <span style="font-weight:700;font-size:12.5px">${title}</span>
    <span style="font-weight:400;font-size:11px;color:${primary ? 'rgba(255,255,255,.85)' : 'var(--mute)'};line-height:1.55">${desc}</span>
  </button>`;
}

function shareModal() {
  openModal('分享 / 导出', `
    <div style="font-size:12px;color:var(--sub);line-height:1.75;margin-bottom:14px">
      数据默认保存在本机浏览器，<b>不会跟着文件走</b>。要给别人看进度或让别人复用这个工具，导出下面的文件发给他即可——
      对方双击打开就能用，<b>无需安装任何软件，也不需要联网</b>。
    </div>
    <div class="grid" style="grid-template-columns:1fr 1fr;gap:10px">
      ${shareCard('① 给同事看进度（含当前数据）', `把当前全部进度、缺陷、轮次、记录打包进 HTML。同事打开即看到此刻状态，并可在自己电脑上继续填写。`, 'exportShareData', true)}
      ${shareCard('② 空白模板（同事自建项目）', '同款工具但不含任何数据，同事可用它管理自己的测试项目。', 'exportShareBlank', false)}
      ${shareCard('③ JSON 备份（交接 / 换电脑）', '仅数据的备份文件，可在任意一台电脑上用「导入」恢复。', 'exportJsonBtn', false)}
      ${shareCard('④ CSV 台账 / 缺陷清单', '导出 Excel 可打开的表格，用于汇报或归档。', 'exportCsvBoth', false)}
    </div>
    <div class="hr"></div>
    <div style="font-size:11.5px;color:var(--mute);line-height:1.75">
      <b>协同提醒：</b>① 导出的分享文件是<b>某一时刻的快照</b>，不会与你的看板自动同步；后续如需同步，让对方导出 JSON 备份，你再用「导入」合并查看。<br>
      <b>数据提醒：</b>清理浏览器缓存 / 换浏览器会导致本机数据丢失，建议每周用 ③ 备份一次。
    </div>
  `, `<button class="btn" data-close>关闭</button>`);
}

/* =========================================================
   视图：使用说明
   ========================================================= */
function renderHelp() {
  const step = (n, t, d) => `<div style="display:flex;gap:12px;padding:11px 0;border-bottom:1px dashed var(--line2)">
    <div style="flex:0 0 26px;height:26px;border-radius:8px;background:var(--brand-soft);color:var(--brand-2);font-weight:750;font-size:12px;display:flex;align-items:center;justify-content:center">${n}</div>
    <div><div style="font-weight:600;font-size:12.5px">${t}</div><div style="font-size:12px;color:var(--sub);line-height:1.65;margin-top:2px">${d}</div></div>
  </div>`;

  return `
  <div class="sec-title"><h2>使用说明</h2><span class="desc">每天 3 分钟，进度自然清晰</span></div>

  ${S.embedded ? `<div class="card" style="padding:12px 16px;margin-bottom:14px;background:var(--brand-soft);border-color:#c9d5f8">
    <div style="font-size:12.5px;color:var(--brand-2);line-height:1.7">
      <b>你打开的是别人分享的进度快照。</b>首次打开时已载入其中的数据，之后你在本机所做的任何修改只保存在你自己的浏览器里，不会影响分享者的文件。
    </div>
  </div>` : ''}

  <div class="split">
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="card">
        <div class="card-h"><h3>每天怎么用</h3></div>
        <div class="card-b" style="padding-top:4px">
          ${step(1, '写一条今日记录', '点右上角「＋ 今日记录」：今天做了什么、遇到什么问题、卡在哪、怎么解决的、还需要什么资源。问题与阻碍会自动汇总到「问题与阻碍」页。')}
          ${step(2, '更新台账状态与进度', '在「测试项台账」改状态（未开始/进行中/阻塞/完成）和进度百分比；需要详细说明的点「明细」填写负责人、计划/实际完成日期、判定结果与证据位置。')}
          ${step(3, '有问题就登记缺陷', '测试发现的问题在「缺陷管理」登记：严重等级、责任人、发现版本、要求关闭日期。卡片可直接拖到「已关闭」列。')}
          ${step(4, '阶段达标就勾门禁', '每个阶段展开后有「准出/门禁检查」，逐项落实后勾选。全部勾选后，下一阶段自动解锁。')}
          ${step(5, '每周看一眼「周报」与「组员进度」', '周报按自然周自动汇总，可一键生成、AI 润色后发上级；带团队的话在「组员进度」页一眼看清每个人的进度、问题阻碍与预计完成时间。')}
        </div>
      </div>

      <div class="card">
        <div class="card-h"><h3>数据在哪、会不会丢</h3></div>
        <div class="card-b" style="font-size:12.5px;color:var(--ink2);line-height:1.85">
          · 数据保存在<b>当前浏览器</b>的本地存储中，不上传任何服务器，断网也能用。<br>
          · <b>三重保护：</b>① 每次改动 0.1 秒内自动落盘；② 每 ${S.backup.interval || 3} 分钟 + 每次退出前自动存一份完整快照（可在「数据保险箱」里回滚到任意一份）；③ 绑定数据文件夹后同步写入真实磁盘目录。<br>
          · 每日记录写到一半也会自动存草稿，卡死重开仍在。<br>
          · <b>多项目</b>：JSON 备份包含<b>全部项目</b>；单项目 JSON 或同事分享的文件导入时会作为<b>新项目</b>加入，不覆盖现有数据。<br>
          · <b>附件</b>（测试项明细里添加）保存在本机浏览器 IndexedDB，<b>不随 JSON 备份 / 分享文件走</b>，重要附件请保留源文件。<br>
          · 仍建议每周用「分享 / 导出 → JSON 备份」保存一次（快捷键 Ctrl+S），防清缓存。
        </div>
      </div>

      <div class="card">
        <div class="card-h"><h3>怎么发给同事</h3></div>
        <div class="card-b" style="font-size:12.5px;color:var(--ink2);line-height:1.85">
          · <b>让同事看到当前进度</b>：分享/导出 → ①「给同事看进度（含当前数据）」，会下载一个 HTML 文件，微信/邮件发出去即可，对方双击就能看到完整进度。<br>
          · <b>让同事也用这个工具</b>：②「空白模板」，不含你的数据。<br>
          · 对方不需要安装任何东西，也不需要联网。对方打开后看到的是<b>快照</b>，双方数据各自独立，不会互相覆盖。
        </div>
      </div>
    </div>

    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="card">
        <div class="card-h"><h3>各页面分别管什么</h3></div>
        <div class="card-b" style="font-size:12.5px;color:var(--ink2);line-height:1.9">
          <b>项目总览（一级分类）</b>：全部项目任务卡片——进度、健康度、当前阶段，可新建 / 重命名 / 删除 / 切换；进入某个项目后，下面的页面都是该项目内部的测试流程（二级分类）。<br>
          <b>总览</b>：项目健康度、整体进度、排期甘特、门禁、缺陷与风险。<br>
          <b>测试流程</b>：顶部步骤条定位当前位置；每个阶段五步走——① 准入 → ② 要做的测试项 → ③ 操作步骤（照着做）→ ④ 门禁（什么算完成）→ ⑤ 输出交接物；默认「只看当前阶段」，其余折叠成一行。<br>
          <b>汇总报告</b>：一页纸报告，可打印或导出 PDF 发上级。<br>
          <b>测试项台账</b>：测试项状态、进度、结果、证据；明细里可<b>添加附件</b>（PDF / Word / Excel / 图片 / 音视频 / 压缩包等）。<br>
          <b>版本轮次</b>：每个构建版本测了什么、回归到哪、结论如何。<br>
          <b>缺陷管理</b>：缺陷看板与清单，严重缺陷影响准出。<br>
          <b>指标追溯</b>：指标 → 测试项 → 结果 → 证据。<br>
          <b>数据保险箱</b>：自动快照回滚、数据文件夹绑定（workspace.json + 各项目 JSON）。<br>
          <b>每日记录</b>：每天的工作日志（边写边自动存草稿）。<br>
          <b>周报</b>：按自然周自动汇总，可一键生成、AI 润色、导出 .md。<br>
          <b>问题与阻碍</b>：日志中问题/阻碍/资源的闭环跟踪。<br>
          <b>组员进度（组长）</b>：一屏看清每个人的进度、问题阻碍与预计完成时间。<br>
          <b>数据保险箱</b>：自动备份、快照回滚、绑定数据文件夹。
        </div>
      </div>

      <div class="card">
        <div class="card-h"><h3>流程硬规则</h3></div>
        <div class="card-b" style="font-size:12.5px;color:var(--ink2);line-height:1.9">
          · <b>🚦 硬门禁</b>（S2 方案评审）：评审不通过不得进入下一阶段。<br>
          · <b>层级结构（共 5 层）</b>：第 1–3 层 S1→S2→S3 串行，前一门禁未全勾选则下一层锁定；<b>第 4 层 S4 是同级任务节点层</b>——研发测试 / 版本迭代测试 / 验收测试 / 部门协助四类任务<b>地位相同、互不为前置</b>，按下发任务单执行对应类别（通常只有一类），只依赖 S3 环境就绪；第 5 层 S5 归档要求已下发任务全部准出。<br>
          · <b>任务类型设置</b>：流程页顶部「下发任务类型判定」或「项目信息」里勾选，并登记下发依据；未下发的任务不进入流程、不计入进度与门禁。<br>
          · <b>🎛 设备库（S4 二级分类）</b>：在「测试执行 → 设备库」维护三级结构——<b>设备类型</b>（纯侦测 / 纯打击 / 侦测打击诱骗一体，可增删改查）→ <b>具体设备</b>（可增删改查）→ <b>该类型的测试项模板</b>（模块化增删改查、可排序、可跨类型复制）。登记设备后，S4 各任务线自动按「设备 × 模板」生成测试项，进度按设备独立记录，并计入台账、追溯与报告。<br>
          · <b>🔒 独立判定</b>（S4 验收测试）：指标全覆盖、原始证据齐全，<b>项目组说辞不作为通过依据</b>，由测试负责人独立签署。<br>
          · <b>偏差</b>：任何不通过项须走书面审批，未审批不得判定通过。
        </div>
      </div>

      <div class="card">
        <div class="card-h"><h3>小技巧</h3></div>
        <div class="card-b" style="font-size:12.5px;color:var(--ink2);line-height:1.9">
          · 顶部项目名可点击，修改项目名称、样机型号、规格书版本与测试周期。<br>
          · Ctrl + S 快速备份，Esc 关闭弹窗。<br>
          · 汇总报告页点「打印/导出 PDF」，在打印对话框里选“另存为 PDF”即可。<br>
          · 想让周报更漂亮：在「周报」页点「AI 接口设置」，填入兼容 OpenAI 的接口地址与 Key，之后点「✨ AI 生成」就能自动成文。<br>
          · 让数据落在真实文件夹里：在「数据保险箱」绑定一个文件夹，之后每次改动都会自动写进去。
        </div>
      </div>
    </div>
  </div>`;
}
function download(text, filename, type) {
  const blob = new Blob([text], {type: type || 'text/plain;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800);
}

document.addEventListener('click', e => {
  const tt = e.target.closest('[data-act="toggleTrack"]');
  if (tt) {
    const id = tt.dataset.id;
    S.meta.tracks = S.meta.tracks || Object.assign({}, DEFAULT_TRACKS);
    S.meta.tracks[id] = !trackOn(id);
    S.meta.taskDecided = true;
    save(); render();
    toast(S.meta.tracks[id]
      ? `本项目任务类型已加入：${stageById(id).name}`
      : `本项目不下发：${stageById(id).name}（其数据保留，不计入统计与门禁）`);
    return;
  }
  if (e.target.closest('[data-close]') || e.target.id === 'modal') { closeModal(); return; }
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const act = el.dataset.act;

  switch (act) {
    case 'view':
      if (el.dataset.stage) S.open[el.dataset.stage] = true;
      go(el.dataset.view);
      break;

    /* 多项目 */
    case 'openProj': switchProject(el.dataset.id); break;
    case 'openProjMeta':
      switchProject(el.dataset.id);
      setTimeout(openMetaModal, 60);
      break;
    case 'delProj': deleteProject(el.dataset.id); break;
    case 'newProj': newProjectModal(); break;
    case 'saveNewProj': {
      const name = $('#npName').value.trim();
      if (!name) { toast('请填写项目名称'); return; }
      const meta = {
        name, model: $('#npModel').value.trim(), spec: $('#npSpec').value.trim(),
        owner: $('#npOwner').value.trim(), pm: $('#npPm').value.trim(), period: $('#npPeriod').value.trim(),
        taskDoc: ($('#npTaskDoc') ? $('#npTaskDoc').value.trim() : ''), taskDecided: true,
        tracks: {}
      };
      PAR_TRACKS.forEach(id => {
        const cb = $(`input[data-act="npTrack"][data-id="${id}"]`);
        meta.tracks[id] = cb ? cb.checked : (id === 'rd');
      });
      S = createProject(meta);
      S.view = 'flow';
      closeModal();
      flushSave(); render();
      toast('已创建项目：' + name);
      break;
    }
    case 'pickImport': { const fi = $('#fileInput'); if (fi) fi.click(); break; }
    case 'acceptEmbed': {
      if (!pendingEmbed) break;
      try {
        const st = migrate(pendingEmbed);
        st.pid = uid(); st.view = 'dash';
        WS.list.push({id: st.pid, created: Date.now()});
        WS.active = st.pid; saveWS();
        try { localStorage.setItem(projKey(st.pid), JSON.stringify(st)); } catch (e) {}
        pendingEmbed = null;
        snapCache = null; snapsReady = false;
        S = st;
        initSnaps(); flushSave(); render();
        toast('已导入为新项目：' + (st.meta.name || '未命名'));
      } catch (err) { toast('导入失败：内嵌数据损坏'); }
      break;
    }
    case 'dismissEmbed': pendingEmbed = null; render(); break;

    /* 附件 */
    case 'dlFile': {
      (async () => {
        const r = await fileGet(el.dataset.fid);
        if (!r) { toast('附件数据不存在'); return; }
        download(new Blob([new Uint8Array(r.data)], {type: r.mime || 'application/octet-stream'}), r.name, r.mime || 'application/octet-stream');
      })();
      break;
    }
    case 'delFile': {
      const fid = el.dataset.fid, key = el.dataset.key;
      (async () => {
        await fileDel(fid);
        const v = getItem(key);
        v.files = (v.files || []).filter(x => x !== fid);
        setItem(key, {files: v.files});
        loadAttachments(key);
        toast('附件已删除');
      })();
      break;
    }

    case 'toggleOpen':
      S.open[el.dataset.id] = !S.open[el.dataset.id]; save(); render(); break;
    case 'openStage': {
      const sid = el.dataset.id;
      S.open[sid] = true;
      S.flowFocus = false;           // 手动展开即退出聚焦模式
      save(); render();
      setTimeout(() => {
        const card = document.querySelector(`[data-stagecard="${sid}"]`);
        if (card) card.scrollIntoView({behavior:'smooth', block:'center'});
      }, 60);
      break;
    }
    case 'focusMode': {
      S.flowFocus = !(S.flowFocus !== false);
      if (S.flowFocus) S.open = {};
      save(); render();
      $('#view').scrollTop = 0;
      break;
    }
    case 'expandAll': S.flowFocus = false; STAGES.forEach(s => S.open[s.id] = true); save(); render(); break;
    /* ---- 账户 / 身份 ---- */
    case 'login': loginModal(); break;
    case 'doLogin': {
      const id = $('#lgUser') && $('#lgUser').value;
      const a = (WS.accounts || []).find(x => x.id === id);
      if (!a) { toast('请选择一个账户'); break; }
      const pw = $('#lgPass') ? $('#lgPass').value : '';
      if (a.pass && hashPass(pw) !== a.pass) { toast('口令不正确'); break; }
      WS.session.userId = a.id; saveWS(); closeModal(); render();
      toast('已登录：' + (a.name || a.user) + '（' + (a.role === 'leader' ? '组长' : '组员') + '）');
      break;
    }
    case 'doLogout':
      WS.session.userId = null; saveWS(); closeModal(); render(); toast('已切换为组长身份（本机）'); break;
    case 'addAcc': accModal(null); break;
    case 'editAcc': accModal((WS.accounts || []).find(a => a.id === el.dataset.id)); break;
    case 'saveAcc': {
      if (!isLeader()) { toast('仅组长可管理账户'); break; }
      const name = $('#acName').value.trim(), user = $('#acUser').value.trim();
      if (!name || !user) { toast('姓名与登录名必填'); break; }
      const pw = $('#acPass').value;
      const d = {name, user, role: $('#acRole').value};
      if (pw) d.pass = hashPass(pw);
      const cur = (WS.accounts || []).find(a => a.id === el.dataset.id);
      if (cur) Object.assign(cur, d);
      else { d.id = uid(); d.created = Date.now(); if (!d.pass) d.pass = ''; WS.accounts.push(d); }
      saveWS(); closeModal(); render(); toast('账户已保存');
      break;
    }
    case 'delAcc': {
      if (!isLeader()) { toast('仅组长可删除账户'); break; }
      if (!confirm('确定删除该账户？（仅删除登录身份，不会删除其测试数据）')) break;
      WS.accounts = (WS.accounts || []).filter(a => a.id !== el.dataset.id);
      if (WS.session.userId === el.dataset.id) WS.session.userId = null;
      saveWS(); render(); toast('账户已删除');
      break;
    }

    /* ---- 资源调度 ---- */
    case 'resMode': RES_VIEW.mode = el.dataset.id; render(); break;
    case 'resPrev': resShift(-1); render(); break;
    case 'resNext': resShift(1); render(); break;
    case 'resToday': RES_VIEW.date = today(); render(); break;
    case 'resAdd': resBatchModal(); break;
    case 'resOpen': resReqModal(resReqs().find(r => r.id === el.dataset.id)); break;
    case 'batchRowAdd': RES_BATCH.rows.push({typeId: (resTypes()[0] || {}).id, qty: 1}); renderBatchRows(); break;
    case 'batchRowDel': RES_BATCH.rows.splice(Number(el.dataset.i), 1); renderBatchRows(); break;
    case 'batchTplPick': {
      const t = (WS.res.templates || []).find(x => x.id === el.value);
      if (t) { RES_BATCH.rows = t.items.map(x => ({typeId: x.typeId, qty: x.qty || 1})); renderBatchRows(); toast('已载入常用清单：' + t.name); }
      break;
    }
    case 'batchTplDel': {
      const sel = $('#rsTplPick');
      const id = sel && sel.value;
      if (!id) { toast('请先在下拉框选中要删除的常用清单'); break; }
      if (!confirm('确定删除这个常用清单模板？（不影响已提交的申请）')) break;
      const snap = batchSnap(false);
      WS.res.templates = (WS.res.templates || []).filter(x => x.id !== id);
      saveWS(); closeModal(); resBatchModal(); batchSnap(snap); toast('常用清单已删除');
      break;
    }
    case 'batchTplSave': {
      const rows = RES_BATCH.rows.filter(r => r.typeId);
      if (!rows.length) { toast('清单为空，先添加资源行'); break; }
      const name = ($('#tplName').value || '').trim() || ('清单 ' + fmtTime(Date.now()).slice(0, 5));
      const snap = batchSnap(false);
      WS.res.templates = WS.res.templates || [];
      WS.res.templates.push({id: 'tp_' + uid(), name, items: rows.map(r => ({typeId: r.typeId, qty: Math.max(1, Number(r.qty) || 1)})), created: Date.now()});
      saveWS(); closeModal(); resBatchModal();
      RES_BATCH.rows = rows.map(r => ({typeId: r.typeId, qty: r.qty}));
      renderBatchRows(); batchSnap(snap);
      toast('已存为常用清单：' + name);
      break;
    }
    case 'saveResBatch': {
      const who = ($('#rsWho').value || '').trim() || meName() || '未署名';
      const date = $('#rsDate').value || today();
      const start = $('#rsStart').value || '09:00';
      const end = $('#rsEnd').value || '12:00';
      const purpose = ($('#rsPurpose').value || '').trim();
      if (minOf(end) <= minOf(start)) { toast('结束时间需晚于开始时间'); break; }
      const rows = RES_BATCH.rows.filter(r => r.typeId);
      if (!rows.length) { toast('请至少添加一种资源'); break; }
      const created = Date.now();
      const st0 = isLeader() ? 'approved' : 'pending';
      rows.forEach(r => WS.res.reqs.push({
        id: uid(), typeId: r.typeId, applicant: who, date, start, end,
        qty: Math.max(1, Number(r.qty) || 1), purpose,
        projName: (S.meta && S.meta.name) || '', status: st0, created, batch: true
      }));
      RES_BATCH.rows = [];
      saveWS(); closeModal(); render();
      const n = Object.keys(resConflictMap()).length;
      toast(`已提交 ${rows.length} 条资源排期` + (n ? `，其中 ${n} 条与先提交者冲突，请协商交叉测试` : '，无冲突'));
      break;
    }
    case 'saveRes': {
      const d = {
        typeId: $('#rsType').value,
        applicant: $('#rsWho').value.trim() || meName() || '未署名',
        date: $('#rsDate').value || today(),
        start: $('#rsStart').value || '09:00',
        end: $('#rsEnd').value || '12:00',
        qty: Math.max(1, Number($('#rsQty').value) || 1),
        purpose: $('#rsPurpose').value.trim(),
        projName: (S.meta && S.meta.name) || ''
      };
      if (minOf(d.end) <= minOf(d.start)) { toast('结束时间需晚于开始时间'); break; }
      const cur = resReqs().find(r => r.id === el.dataset.id);
      if (cur) Object.assign(cur, d, {updated: Date.now()});
      else { d.id = uid(); d.created = Date.now(); d.status = isLeader() ? 'approved' : 'pending'; WS.res.reqs.push(d); }
      saveWS(); closeModal(); render();
      const cm = resConflictMap();
      if (cm[cur ? cur.id : d.id]) toast('已保存，但该时段与先提交的排期冲突，请发起协商');
      else toast('资源申请已提交');
      break;
    }
    case 'resDel': {
      if (!confirm('确定删除这条资源申请？')) break;
      WS.res.reqs = resReqs().filter(r => r.id !== el.dataset.id);
      saveWS(); closeModal(); render(); toast('申请已删除');
      break;
    }
    case 'resApprove': { const r = resReqs().find(x => x.id === el.dataset.id); if (r) { r.status = 'approved'; saveWS(); render(); toast('已批准入档'); } break; }
    case 'resReject': { const r = resReqs().find(x => x.id === el.dataset.id); if (r) { r.status = 'rejected'; saveWS(); render(); toast('已驳回'); } break; }
    case 'resDone':   { const r = resReqs().find(x => x.id === el.dataset.id); if (r) { r.status = 'done'; saveWS(); render(); toast('已标记完成'); } break; }
    case 'negoStart': negoModal(resReqs().find(r => r.id === el.dataset.id)); break;
    case 'saveNego': {
      const r = resReqs().find(x => x.id === el.dataset.id);
      if (!r) break;
      const cm = resConflictMap();
      const first = ((cm[r.id] || {}).withIds || []).map(id => resReqs().find(x => x.id === id)).filter(Boolean)[0];
      r.nego = {toName: first ? (first.applicant || '—') : '已占用者', toId: first ? first.id : '', status: 'waiting',
        note: $('#ngNote').value.trim(), at: Date.now(), by: meName() || '本人'};
      WS.res.reqs.forEach(x => { if (x.id === (first && first.id)) x.negoRef = r.id; });
      saveWS(); closeModal(); render(); toast('已发起协商，等待对方或组长确认');
      break;
    }
    case 'negoAgree': {
      const r = resReqs().find(x => x.id === el.dataset.id);
      if (r && r.nego) { r.nego.status = 'agreed'; r.nego.at = Date.now(); saveWS(); render(); toast('已同意交叉测试'); }
      break;
    }
    case 'negoReject': {
      const r = resReqs().find(x => x.id === el.dataset.id);
      if (r && r.nego) { r.nego.status = 'rejected'; r.nego.at = Date.now(); saveWS(); render(); toast('已标记协商未达成'); }
      break;
    }
    case 'resTypeMgr': resTypeMgrModal(); break;
    case 'addResType': resTypeModal(null); break;
    case 'editResType': resTypeModal(resTypes().find(t => t.id === el.dataset.id)); break;
    case 'pickIcon': {
      $('#rtIcon').value = el.dataset.id;
      document.querySelectorAll('[data-act="pickIcon"]').forEach(b => b.classList.toggle('primary', b.dataset.id === el.dataset.id));
      break;
    }
    case 'saveResType': {
      if (!isLeader()) { toast('仅组长可管理资源类型'); break; }
      const name = $('#rtName').value.trim();
      if (!name) { toast('请填写资源名称'); break; }
      const d = {name, unit: $('#rtUnit').value.trim() || '台', total: Math.max(0, Number($('#rtTotal').value) || 0),
        icon: $('#rtIcon').value || '📦', note: $('#rtNote').value.trim()};
      const cur = resTypes().find(t => t.id === el.dataset.id);
      if (cur) Object.assign(cur, d);
      else { d.id = 'rt_' + uid(); WS.res.types.push(d); }
      saveWS(); closeModal(); render(); toast('资源类型已保存');
      break;
    }
    case 'delResType': {
      if (!isLeader()) { toast('仅组长可删除资源类型'); break; }
      const t = resTypes().find(x => x.id === el.dataset.id);
      const used = resReqs().filter(r => r.typeId === el.dataset.id).length;
      if (!confirm(`确定删除资源类型「${t ? t.name : ''}」？${used ? `\n该类型下已有 ${used} 条申请，删除后这些申请将显示为「已删除类型」。` : ''}`)) break;
      WS.res.types = resTypes().filter(x => x.id !== el.dataset.id);
      saveWS(); render(); toast('资源类型已删除');
      break;
    }
    case 'collapseAll': S.open = {}; save(); render(); break;

    /* ---------- 设备库：S4 二级分类（类型 / 设备 / 测试项模板） ---------- */
    case 'devToggle': {
      const k = `${el.dataset.sid}|${el.dataset.dev}`;
      S.devUI.open = S.devUI.open || {};
      S.devUI.open[k] = !S.devUI.open[k];
      save(); render();
      break;
    }
    case 'devPickType': S.devUI.curTid = el.dataset.id; save(); render(); break;
    case 'devTypeAdd': devTypeModal(null); break;
    case 'devTypeEdit': devTypeModal(devTypeById(el.dataset.id)); break;
    case 'devTypeDel': {
      const t = devTypeById(el.dataset.id);
      if (!t) break;
      const n = devList().filter(d => d.tid === t.id).length;
      if (!confirm(`删除设备类型「${t.name}」？\n将同时删除其下 ${n} 台设备、测试项模板，以及这些设备已记录的测试进度。`)) break;
      const devIds = devList().filter(d => d.tid === t.id).map(d => d.id);
      S.devices = devList().filter(d => d.tid !== t.id);
      delete S.devTpl[t.id];
      S.devTypes = devTypes().filter(x => x.id !== t.id);
      Object.keys(S.items).forEach(k => {
        if (k.indexOf('dev|') === 0 && devIds.indexOf(k.split('|')[2]) >= 0) delete S.items[k];
      });
      if (S.devUI.curTid === t.id) S.devUI.curTid = (S.devTypes[0] || {}).id || '';
      save(); render(); toast('设备类型已删除：' + t.name);
      break;
    }
    case 'saveDevType': {
      const name = $('#dtName').value.trim();
      if (!name) { toast('请填写设备类型名称'); return; }
      const id = el.dataset.id;
      if (id) {
        const t = devTypeById(id);
        if (t) Object.assign(t, {name, tone: $('#dtTone').value, note: $('#dtNote').value.trim()});
      } else {
        const t = {id: uid(), name, tone: $('#dtTone').value, note: $('#dtNote').value.trim()};
        S.devTypes.push(t);
        S.devTpl[t.id] = [];
        S.devUI.curTid = t.id;
      }
      closeModal(); save(); render(); toast('设备类型已保存');
      break;
    }
    case 'devAdd': devModal(null); break;
    case 'devEdit': devModal(devById(el.dataset.id)); break;
    case 'devDel': {
      const d = devById(el.dataset.id);
      if (!d) break;
      if (!confirm(`删除设备「${d.name}」？\n该设备在各任务线下的测试进度会一并清理，模板本身不受影响。`)) break;
      S.devices = devList().filter(x => x.id !== d.id);
      Object.keys(S.items).forEach(k => {
        if (k.indexOf('dev|') === 0 && k.split('|')[2] === d.id) delete S.items[k];
      });
      save(); render(); toast('设备已删除：' + d.name);
      break;
    }
    case 'saveDev': {
      const name = $('#dvName').value.trim();
      if (!name) { toast('请填写设备名称'); return; }
      const patch = {name, model: $('#dvModel').value.trim(), tid: $('#dvType').value, note: $('#dvNote').value.trim()};
      if (el.dataset.id) Object.assign(devById(el.dataset.id), patch);
      else S.devices.push(Object.assign({id: uid()}, patch));
      S.devUI.curTid = patch.tid;
      closeModal(); save(); render(); toast('设备已保存');
      break;
    }
    case 'tplAdd': tplModal(el.dataset.tid, null); break;
    case 'tplEdit': tplModal(el.dataset.tid, devTplOf(el.dataset.tid).find(x => x.id === el.dataset.id)); break;
    case 'saveTpl': {
      const tid = el.dataset.tid;
      const name = $('#tpName').value.trim();
      if (!name) { toast('请填写测试项名称'); return; }
      const patch = {cat: $('#tpCat').value.trim() || '其他', name, std: $('#tpStd').value.trim()};
      const list = devTplOf(tid);
      if (el.dataset.id) Object.assign(list.find(x => x.id === el.dataset.id), patch);
      else list.push(Object.assign({id: uid()}, patch));
      S.devTpl[tid] = list;
      closeModal(); save(); render(); toast('测试项已保存');
      break;
    }
    case 'tplDel': {
      const tid = el.dataset.tid, id = el.dataset.id;
      const list = devTplOf(tid);
      const x = list.find(y => y.id === id);
      if (!x) break;
      if (!confirm(`删除测试项「${x.name}」？\n该类型下所有设备的这条测试项及其进度会一并清理。`)) break;
      S.devTpl[tid] = list.filter(y => y.id !== id);
      Object.keys(S.items).forEach(k => {
        if (k.indexOf('dev|') === 0 && k.split('|')[3] === id) delete S.items[k];
      });
      save(); render(); toast('测试项已删除');
      break;
    }
    case 'tplUp': case 'tplDown': {
      const tid = el.dataset.tid, id = el.dataset.id;
      const list = devTplOf(tid);
      const i = list.findIndex(x => x.id === id);
      const j = act === 'tplUp' ? i - 1 : i + 1;
      if (i < 0 || j < 0 || j >= list.length) break;
      const tmp = list[i]; list[i] = list[j]; list[j] = tmp;
      S.devTpl[tid] = list;
      save(); render();
      break;
    }
    case 'tplCopy': {
      const tid = el.dataset.tid;
      const others = devTypes().filter(t => t.id !== tid && devTplOf(t.id).length);
      if (!others.length) { toast('其他类型还没有可复制的模板'); break; }
      openModal('从其他设备类型复制测试项', `
        <div class="field"><label>来源类型</label>
          <select class="inp" id="cpFrom">${others.map(t => `<option value="${t.id}">${esc(t.name)}（${devTplOf(t.id).length} 项）</option>`).join('')}</select></div>
        <div class="field" style="margin-top:12px"><label>方式</label>
          <select class="inp" id="cpMode">
            <option value="append">追加到现有模板后面</option>
            <option value="replace">替换现有模板</option>
          </select></div>
        <div style="margin-top:12px;font-size:11.5px;color:var(--mute)">复制后仍可在本页继续增删改，不影响来源类型。</div>`,
        `<button class="btn" data-close>取消</button><button class="btn primary" data-act="doTplCopy" data-tid="${esc(tid)}">复制</button>`);
      break;
    }
    case 'doTplCopy': {
      const tid = el.dataset.tid, from = $('#cpFrom').value, mode = $('#cpMode').value;
      const src = devTplOf(from);
      const base = mode === 'replace' ? [] : devTplOf(tid);
      const names = base.map(x => x.name);
      const add = src.filter(x => names.indexOf(x.name) < 0).map(x => ({id: uid(), cat: x.cat, name: x.name, std: x.std}));
      S.devTpl[tid] = base.concat(add);
      closeModal(); save(); render();
      toast(`已复制 ${add.length} 项到「${devTypeName(tid)}」`);
      break;
    }
    case 'tplClear': {
      const tid = el.dataset.tid;
      if (!devTplOf(tid).length) { toast('模板已经是空的'); break; }
      if (!confirm(`清空「${devTypeName(tid)}」的全部测试项模板？\n该类型下设备已实例化的测试项与进度会一并清理。`)) break;
      const ids = devTplOf(tid).map(x => x.id);
      S.devTpl[tid] = [];
      Object.keys(S.items).forEach(k => {
        if (k.indexOf('dev|') === 0 && ids.indexOf(k.split('|')[3]) >= 0) delete S.items[k];
      });
      save(); render(); toast('模板已清空');
      break;
    }

    case 'editItem': editItemModal(el.dataset.key); break;
    case 'saveItem': {
      const key = el.dataset.key;
      S.items[key] = Object.assign(getItem(key), {
        owner: $('#mOwner').value.trim(), status: $('#mStatus').value,
        progress: clamp(Number($('#mProgress').value) || 0, 0, 100),
        result: $('#mResult').value, plan: $('#mPlan').value, actual: $('#mActual').value,
        evidence: $('#mEvidence').value.trim(), note: $('#mNote').value.trim()
      });
      if (S.items[key].progress >= 100) S.items[key].status = 'done';
      closeModal(); save(); render(); toast('已保存：' + itemLabel(key));
      break;
    }
    case 'filterStage': S.filter.stage = el.dataset.id; save(); render(); break;

    /* 版本轮次 */
    case 'addRound':
      openModal('新增测试轮次', roundFields({}),
        `<button class="btn" data-close>取消</button><button class="btn primary" data-act="saveRound">保存</button>`);
      break;
    case 'editRound': {
      const r = S.rounds.find(x => x.id === el.dataset.id);
      if (!r) return;
      openModal('编辑轮次 · ' + r.version, roundFields(r),
        `<button class="btn danger" data-act="delRound" data-id="${r.id}" style="margin-right:auto">删除</button>
         <button class="btn" data-close>取消</button><button class="btn primary" data-act="saveRound" data-id="${r.id}">保存</button>`);
      break;
    }
    case 'saveRound': {
      const d = {
        version: $('#rVer').value.trim() || '未命名版本',
        date: $('#rDate').value || today(),
        type: $('#rType').value,
        owner: $('#rOwner').value.trim(),
        scope: $('#rScope').value.trim(),
        regress: $('#rRegress').value.trim(),
        conclusion: $('#rConcl').value,
        note: $('#rNote').value.trim()
      };
      if (el.dataset.id) {
        Object.assign(S.rounds.find(x => x.id === el.dataset.id), d);
      } else {
        d.id = uid(); S.rounds.push(d);
      }
      closeModal(); save(); render(); toast('轮次已保存');
      break;
    }
    case 'delRound': {
      if (!confirm('删除该测试轮次？')) return;
      S.rounds = S.rounds.filter(x => x.id !== el.dataset.id);
      closeModal(); save(); render(); toast('已删除');
      break;
    }

    /* 缺陷 */
    case 'addBug':
      openModal('登记缺陷 · ' + nextBugId(), bugFields({}),
        `<button class="btn" data-close>取消</button><button class="btn primary" data-act="saveBug">保存</button>`);
      break;
    case 'editBug': {
      const b = S.bugs.find(x => x.id === el.dataset.id);
      if (!b) return;
      openModal(b.no + ' · 缺陷明细', bugFields(b),
        `<button class="btn danger" data-act="delBug" data-id="${b.id}" style="margin-right:auto">删除</button>
         <button class="btn" data-close>取消</button><button class="btn primary" data-act="saveBug" data-id="${b.id}">保存</button>`);
      break;
    }
    case 'saveBug': {
      const d = {
        title: $('#bTitle').value.trim(),
        sev: $('#bSev').value,
        status: $('#bStatus').value,
        stage: $('#bStage').value,
        owner: $('#bOwner').value.trim(),
        version: $('#bVersion').value.trim(),
        found: $('#bFound').value,
        due: $('#bDue').value,
        note: $('#bNote').value.trim()
      };
      if (!d.title) { toast('请填写缺陷标题'); return; }
      if (el.dataset.id) {
        Object.assign(S.bugs.find(x => x.id === el.dataset.id), d);
      } else {
        d.id = uid();
        d.no = $('#bNo').value.trim() || nextBugId();
        S.bugs.push(d);
      }
      closeModal(); save(); render(); toast('缺陷已保存');
      break;
    }
    case 'delBug': {
      if (!confirm('删除该缺陷记录？')) return;
      S.bugs = S.bugs.filter(x => x.id !== el.dataset.id);
      closeModal(); save(); render(); toast('已删除');
      break;
    }

    /* 追溯矩阵 */
    case 'addMatrix':
      S.matrix.push({id:uid(), metric:'', spec:'', itemKey:'', method:'', evidence:'', conclusion:''});
      save(); render(); break;
    case 'delMatrix':
      S.matrix = S.matrix.filter(x => x.id !== el.dataset.id);
      save(); render(); break;

    /* 日志 */
    /* 每日记录 */
    case 'saveLog': {
      const l = readLogForm();
      if (!l.done && !l.issues && !l.blockers && !l.plan) { toast('至少填一点内容吧'); return; }
      l.id = uid(); S.logs.push(l);
      clearDraft();
      flushSave(); render(); toast('已保存 ' + l.date + ' 的记录');
      break;
    }
    case 'clearDraft': clearDraft(); toast('草稿已清空'); break;
    case 'goWeekly': go('weekly'); break;
    case 'editLog': editLogModal(el.dataset.id); break;
    case 'updateLog': {
      const l = S.logs.find(x => x.id === el.dataset.id);
      if (!l) return;
      Object.assign(l, readLogForm());
      closeModal(); save(); render(); toast('已更新');
      break;
    }
    case 'delLog': {
      const l = S.logs.find(x => x.id === el.dataset.id);
      if (!l) return;
      if (!confirm(`删除 ${l.date} 的记录？该条下的问题与阻碍也会一并移除。`)) return;
      S.logs = S.logs.filter(x => x.id !== l.id);
      save(); render(); toast('已删除');
      break;
    }

    case 'toggleIssue':
      S.issueFlags[el.dataset.id] = !S.issueFlags[el.dataset.id]; save(); render(); break;
    case 'closeIssue':
      S.issueFlags[el.dataset.id] = true; save(); render(); toast('已闭环'); break;

    case 'openMeta': openMetaModal(); break;
    case 'saveMeta': {
      S.meta.name = $('#pName').value.trim() || '未命名项目';
      S.meta.model = $('#pModel').value.trim();
      S.meta.spec = $('#pSpec').value.trim();
      S.meta.owner = $('#pOwner').value.trim();
      S.meta.pm = $('#pPm').value.trim();
      S.meta.period = $('#pPeriod').value.trim();
      if ($('#pTaskDoc')) S.meta.taskDoc = $('#pTaskDoc').value.trim();
      PAR_TRACKS.forEach(id => {
        const cb = $(`input[data-act="metaTrack"][data-id="${id}"]`);
        if (cb) S.meta.tracks[id] = cb.checked;
      });
      S.meta.taskDecided = true;
      closeModal(); save(); render(); toast('项目信息已更新');
      break;
    }
    case 'resetAll': {
      if (!confirm(`确定删除当前项目「${S.meta.name || '未命名项目'}」？\n其全部测试项进度、门禁、缺陷、轮次、记录都会删除，且无法恢复。\n建议先「分享 / 导出」做备份。`)) return;
      closeModal();
      deleteProject(S.pid, true);
      break;
    }
    /* 分享 / 导出 */
    case 'exportShareData': exportShare(true); closeModal(); break;
    case 'exportShareBlank': exportShare(false); closeModal(); break;
    case 'exportJsonBtn': exportJson(); break;
    case 'exportCsvBoth': exportJson(); toast('JSON 已导出，如需表格请分别在各页面导出 CSV'); break;
    case 'exportCsv': {
      const head = ['阶段', '分组', '分类', '测试项', '设备类型', '设备', '负责人', '状态', '进度%', '计划完成', '实际完成', '结果', '证据', '备注'];
      const rows = [head.join(',')];
      STAGES.forEach(st => stageGroups(st).forEach(g => g.items.forEach(it => {
        const v = getItem(keyOf(st, it));
        rows.push([st.no + ' ' + st.name, g.name, it[0], it[1], g.dev ? g.typeName : '', g.dev ? g.name : '',
          v.owner, STATUS[v.status].t,
          v.progress, v.plan, v.actual, v.result, v.evidence, v.note].map(csvCell).join(','));
      })));
      download('\ufeff' + rows.join('\r\n'), `测试项台账_${today()}.csv`, 'text/csv;charset=utf-8');
      toast('CSV 已导出');
      break;
    }
    case 'exportBugCsv': {
      const head = ['编号', '标题', '等级', '状态', '阶段', '版本', '责任人', '发现日期', '要求关闭', '说明'];
      const rows = [head.join(',')];
      S.bugs.forEach(x => rows.push([x.no, x.title, SEVERITY[x.sev].t, x.status, stageById(x.stage).name,
        x.version, x.owner, x.found, x.due, x.note].map(csvCell).join(',')));
      download('\ufeff' + rows.join('\r\n'), `缺陷清单_${today()}.csv`, 'text/csv;charset=utf-8');
      toast('缺陷清单已导出');
      break;
    }
    /* 周报 */
    case 'genWeekly': {
      const w = weekRangeOf(today());
      genWeekly(w.start, w.end, '本地生成');
      render(); toast(w.key + ' 周报已生成');
      break;
    }
    case 'saveWeekly': {
      const w = weekRangeOf(today());
      const txt = $('#wkBody').value;
      let x = S.weeklies.find(v => v.key === w.key);
      if (x) { x.body = txt; x.by = /AI/.test(x.by || '') ? x.by : '手动编辑'; x.at = Date.now(); }
      else S.weeklies.push(Object.assign({id: uid()}, {
        key: w.key, start: w.start, end: w.end, title: `${S.meta.name || '测试项目'} · ${w.key} 周报`,
        body: txt, by: '手动编辑', at: Date.now()
      }));
      flushSave(); render(); toast('周报已保存');
      break;
    }
    case 'aiWeekly': aiWeekly(); break;
    case 'aiCfg': aiCfgModal(); break;
    case 'aiPreset': {
      const p = AI_PRESETS[Number(el.dataset.i)];
      if (p) { $('#aiBase').value = p.base; $('#aiModel').value = p.model; }
      break;
    }
    case 'saveAiCfg': {
      setAiCfg({base: $('#aiBase').value.trim(), model: $('#aiModel').value.trim(), key: $('#aiKey').value.trim()});
      closeModal(); toast('AI 配置已保存到本机（不会写入备份文件）');
      break;
    }
    case 'copyPrompt': copyText(window.__aiPrompt || ''); break;
    case 'aiUse': {
      const t = $('#aiOut') ? $('#aiOut').value : aiText;
      const ta = $('#wkBody');
      if (ta) { ta.value = t; aiText = t; }
      closeModal(); toast('已填入周报编辑框，确认后点「保存本周周报」');
      break;
    }
    case 'dlWeeklyCur': {
      const w = weekRangeOf(today());
      const txt = $('#wkBody') ? $('#wkBody').value : '';
      exportWeeklyFile(w, txt);
      break;
    }
    case 'dlWeekly': {
      const x = S.weeklies.find(v => v.id === el.dataset.id);
      if (x) exportWeeklyFile({key: x.key, start: x.start, end: x.end}, x.body);
      break;
    }
    case 'delWeekly': {
      if (!confirm('删除这份周报？')) return;
      S.weeklies = S.weeklies.filter(v => v.id !== el.dataset.id);
      save(); render(); toast('已删除');
      break;
    }
    case 'loadWeekly': {
      const x = S.weeklies.find(v => v.id === el.dataset.id);
      const ta = $('#wkBody');
      if (x && ta) { ta.value = x.body; ta.scrollIntoView({block: 'center'}); toast('已载入到本周编辑框'); }
      break;
    }
    case 'copyWeekly': {
      const t = $('#wkBody') ? $('#wkBody').value : '';
      copyText(t);
      break;
    }
    case 'toggleWk': {
      const b2 = $('#wkb-' + el.dataset.id);
      if (b2) { b2.classList.toggle('collapsed'); el.textContent = b2.classList.contains('collapsed') ? '展开全文' : '收起'; }
      break;
    }

    /* 组员 / 组长视图 */
    case 'addMember':
      openModal('添加组员', memberFields({}),
        `<button class="btn" data-close>取消</button><button class="btn primary" data-act="saveMember">保存</button>`);
      break;
    case 'editMember': {
      const m = S.members.find(x => x.id === el.dataset.id);
      if (!m) return;
      openModal('编辑组员 · ' + m.name, memberFields(m),
        `<button class="btn danger" data-act="delMember" data-id="${m.id}" style="margin-right:auto">删除</button>
         <button class="btn" data-close>取消</button><button class="btn primary" data-act="saveMember" data-id="${m.id}">保存</button>`);
      break;
    }
    case 'saveMember': {
      const name = $('#mbName').value.trim();
      if (!name) { toast('请填写姓名'); return; }
      const d = {
        name: name, role: $('#mbRole').value.trim(), module: $('#mbModule').value.trim(),
        stage: $('#mbStage').value, aliases: $('#mbAlias').value.trim(),
        eta: $('#mbEta').value, summary: $('#mbSummary').value.trim(), note: $('#mbNote').value.trim()
      };
      if (el.dataset.id) Object.assign(S.members.find(x => x.id === el.dataset.id), d);
      else { d.id = uid(); S.members.push(d); }
      closeModal(); flushSave(); render(); toast('组员已保存');
      break;
    }
    case 'delMember': {
      if (!confirm('删除该组员？不会删除他的测试项与记录，仅从组长视图移除。')) return;
      S.members = S.members.filter(x => x.id !== el.dataset.id);
      closeModal(); save(); render(); toast('已删除');
      break;
    }
    case 'scanMembers': {
      const names = new Set();
      S.logs.forEach(l => { if (l.author && !matchMember(l.author)) names.add(l.author.trim()); });
      allItems().forEach(i => { const v = getItem(i.key); if (v.owner && !matchMember(v.owner)) names.add(v.owner.trim()); });
      const list = Array.from(names).filter(Boolean);
      if (!list.length) { toast('没有发现新的姓名'); return; }
      if (!confirm('将把以下姓名建为组员：\n' + list.join('、'))) return;
      list.forEach(n => S.members.push({id: uid(), name: n, role: '', module: '', stage: 'rd', aliases: '', eta: '', summary: '', note: ''}));
      flushSave(); render(); toast('已添加 ' + list.length + ' 名组员');
      break;
    }
    case 'exportTeamCsv': {
      const head = ['组员', '角色', '负责模块', '负责阶段', '负责项完成/总数', '进度%', '本周记录', '未闭环问题', '未闭环阻碍', '未关闭缺陷', '预计完成', '状态'];
      const rows = [head.join(',')];
      S.members.forEach(m => {
        const s = memberStats(m);
        rows.push([m.name, m.role, m.module, stageById(m.stage || 'rd').name, `${s.done}/${s.total}`,
          s.pct, s.wkLogs.length, s.openIssue.length, s.openBlk.length, s.bugOpen, m.eta, s.status.t
        ].map(csvCell).join(','));
      });
      download('\ufeff' + rows.join('\r\n'), `组员进度_${today()}.csv`, 'text/csv;charset=utf-8');
      toast('组员进度已导出');
      break;
    }

    /* 数据保险箱 */
    case 'bindFolder': bindFolder(); break;
    case 'reauthFolder': reauthFolder(); break;
    case 'unbindFolder': unbindFolder(); break;
    case 'syncNow':
      syncFolder(true).then(ok => { if (ok) { flushSave(); render(); toast('已写入数据文件夹'); } });
      break;
    case 'loadFromFolder': loadFromFolder(); break;
    case 'snapNow': pushSnap('手动'); render(); toast('已存一份快照'); break;
    case 'restoreSnap':
      if (confirm('回滚到该快照会覆盖当前全部数据，确定继续？')) restoreSnap(el.dataset.t);
      break;
    case 'dlSnap': {
      const s2 = snapList().find(x => x.t === Number(el.dataset.t));
      if (s2) download(s2.json, `看板快照_${stampNow()}.json`, 'application/json;charset=utf-8');
      break;
    }
    case 'clearSnaps': {
      if (!confirm('清空全部自动快照？主数据不受影响。')) return;
      clearSnapsAll(); render(); toast('快照已清空');
      break;
    }
    case 'purgeStorage': {
      if (!confirm('将清理：全部自动快照 + 记录草稿（主数据保留）。\n建议先做一次 JSON 备份。确定继续？')) return;
      clearSnapsAll(); clearDraft();
      try { localStorage.removeItem(SNAP_KEY + '.' + S.pid); localStorage.removeItem(LAST_KEY + '.' + S.pid); } catch (e) {}
      storageLow = false; storageWarned = false;
      flushSave(); render(); toast('已清理，空间已释放');
      break;
    }

    case 'print':
      if (S.view !== 'report') { S.view = 'report'; save(); render(); }
      setTimeout(() => window.print(), 260);
      break;
  }
});

document.addEventListener('change', e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const act = el.dataset.act, key = el.dataset.key;

  if (act === 'batchRowType') {
    const i = Number(el.dataset.i);
    if (RES_BATCH.rows[i]) { RES_BATCH.rows[i].typeId = el.value; }
  } else if (act === 'batchRowQty') {
    const i = Number(el.dataset.i);
    if (RES_BATCH.rows[i]) RES_BATCH.rows[i].qty = Math.max(1, Number(el.value) || 1);
  } else if (act === 'batchTplPick') {
    const t = (WS.res.templates || []).find(x => x.id === el.value);
    if (t) { RES_BATCH.rows = t.items.map(x => ({typeId: x.typeId, qty: x.qty || 1})); renderBatchRows(); toast('已载入常用清单：' + t.name); }
  } else if (act === 'resFilter') {
    RES_VIEW.typeId = el.value; render();
  } else if (act === 'resDate') {
    RES_VIEW.date = el.value || today(); render();
  } else if (act === 'toggleGate') {
    if (!isLeader()) { toast('门禁判定仅组长可操作'); el.checked = !el.checked; return; }
    S.gates[`${el.dataset.sid}|${el.dataset.idx}`] = el.checked;
    save(); render();
  } else if (act === 'setStatus') {
    setItem(key, {status: el.value}); render();
  } else if (act === 'setProgress') {
    setItem(key, {progress: el.value}); render();
  } else if (act === 'setResult') {
    setItem(key, {result: el.value}); save(); render();
  } else if (act === 'setField') {
    const patch = {}; patch[el.dataset.f] = el.value;
    setItem(key, patch); save();
  } else if (act === 'filterStatus') {
    S.filter.status = el.value; save(); render();
  } else if (act === 'setStageDate') {
    if (!isLeader()) { toast('阶段排期仅组长可修改'); render(); return; }
    S.stageDates[el.dataset.sid] = S.stageDates[el.dataset.sid] || {};
    S.stageDates[el.dataset.sid][el.dataset.f] = el.value;
    save(); render();
  } else if (act === 'setMeta') {
    if (!isLeader()) { toast('项目信息仅组长可修改'); render(); return; }
    S.meta[el.dataset.f] = el.value.trim();
    save();
  } else if (act === 'addFiles') {
    const key = el.dataset.key;
    const files = Array.from(el.files || []);
    el.value = '';
    if (!files.length) return;
    (async () => {
      const v = getItem(key);
      v.files = v.files || [];
      let added = 0;
      for (const f of files) {
        if (f.size > FILE_MAX) { toast(`「${f.name}」超过 50MB 已跳过；大文件建议存共享路径，把位置填到「证据 / 数据位置」`); continue; }
        try {
          const buf = new Uint8Array(await f.arrayBuffer());
          const fid = uid() + Date.now().toString(36);
          if (await filePut({fid, pid: S.pid, name: f.name, mime: f.type || 'application/octet-stream', size: f.size, ts: Date.now(), data: buf})) {
            v.files.push(fid); added++;
          } else toast('附件存储失败：' + f.name);
        } catch (err) { toast('读取失败：' + f.name); }
      }
      if (added) {
        setItem(key, {files: v.files});
        loadAttachments(key);
        toast(`已添加 ${added} 个附件`);
      }
    })();
    return;
  } else if (act === 'setBugStatus') {
    const b = S.bugs.find(x => x.id === el.dataset.id);
    if (b) { b.status = el.value; save(); render(); toast(b.no + ' → ' + el.value); }
  } else if (act === 'setBugField') {
    const b = S.bugs.find(x => x.id === el.dataset.id);
    if (b) { b[el.dataset.f] = el.value; save(); }
  } else if (act === 'mField') {
    const m = S.matrix.find(x => x.id === el.dataset.id);
    if (m) { m[el.dataset.f] = el.value; save(); render(); }
  } else if (act === 'bugFilterSev') {
    S.bugFilter.sev = el.value; save(); render();
  } else if (act === 'bugFilterStatus') {
    S.bugFilter.status = el.value; save(); render();
  } else if (act === 'setBackupAuto') {
    S.backup.auto = el.checked; save(); startAutoBackup(); render();
  } else if (act === 'toggleAutoWeekly') {
    S.backup.autoWeekly = el.checked; save(); render();
  } else if (act === 'setBackupInterval') {
    S.backup.interval = clamp(Number(el.value) || 3, 1, 60); save(); startAutoBackup(); render();
  } else if (act === 'setBackupKeep') {
    S.backup.keep = clamp(Number(el.value) || 12, 3, 60); save(); render();
  } else if (act === 'setEta') {
    const m = S.members.find(x => x.id === el.dataset.id);
    if (m) { m.eta = el.value; save(); render(); }
  }
});

document.addEventListener('input', e => {
  // 任务类型判定卡里的"下发依据"边打边存
  const m = e.target.closest('[data-act="setMeta"]');
  if (m) {
    S.meta[m.dataset.f] = m.value.trim();
    save();
    return;
  }
  const el = e.target.closest('[data-act="filterQ"]');
  if (!el) return;
  S.filter.q = el.value;
  focusQ = el.selectionStart;
  render();
  const n = $('[data-act="filterQ"]');
  if (n) { n.focus(); try { n.setSelectionRange(focusQ, focusQ); } catch (err) {} }
});

/* 缺陷看板拖拽 */
document.addEventListener('dragstart', e => {
  const c = e.target.closest('[data-bug]');
  if (c) { dragBug = c.dataset.bug; try { e.dataTransfer.effectAllowed = 'move'; } catch (err) {} }
});
document.addEventListener('dragover', e => {
  if (!dragBug) return;
  const col = e.target.closest('.kcol');
  if (col) { e.preventDefault(); col.classList.add('drop'); }
});
document.addEventListener('dragleave', e => {
  const col = e.target.closest && e.target.closest('.kcol');
  if (col) col.classList.remove('drop');
});
document.addEventListener('drop', e => {
  if (!dragBug) return;
  const col = e.target.closest('.kcol');
  if (col) {
    e.preventDefault();
    col.classList.remove('drop');
    const b = S.bugs.find(x => x.id === dragBug);
    if (b && b.status !== col.dataset.col) {
      b.status = col.dataset.col;
      save(); render(); toast(b.no + ' → ' + col.dataset.col);
    }
  }
  dragBug = null;
});
document.addEventListener('dragend', () => { dragBug = null; });

/* =========================================================
   导入 / 导出 / 启动
   ========================================================= */
function workspacePayload() {
  return {
    app: 'testboard', kind: 'workspace', v: 2,
    exported: new Date().toISOString(),
    active: WS.active,
    accounts: WS.accounts || [],
    res: WS.res || {types: [], reqs: []},
    projects: WS.list.map(p => ({id: p.id, state: projState(p.id)})).filter(x => x.state)
  };
}
function exportJson() {
  const payload = workspacePayload();
  download(JSON.stringify(payload, null, 2), `测试看板备份_${WS.list.length}项目_${today()}.json`, 'application/json;charset=utf-8');
  toast(`已备份 ${WS.list.length} 个项目（含全部数据）`);
}

function applyWorkspace(d) {
  WS = {list: [], active: null};
  (d.projects || []).forEach(p => {
    if (!p || !p.state) return;
    const st = migrate(p.state);
    st.pid = p.id || st.pid || uid();
    WS.list.push({id: st.pid, created: Date.now()});
    try { localStorage.setItem(projKey(st.pid), JSON.stringify(st)); } catch (e) {}
  });
  if (!WS.list.length) {
    const st = createProject({name: '新建项目'});
    WS.list = [{id: st.pid, created: Date.now()}];
  }
  wsEmpty = false;
  if (Array.isArray(d.accounts)) WS.accounts = d.accounts;
  if (d.res && (Array.isArray(d.res.types) || Array.isArray(d.res.reqs))) {
    WS.res = {types: Array.isArray(d.res.types) && d.res.types.length ? d.res.types : DEFAULT_RES_TYPES.map(t => Object.assign({}, t)),
      reqs: Array.isArray(d.res.reqs) ? d.res.reqs : []};
  }
  wsEmpty = false;
  WS.active = (d.active && WS.list.some(p => p.id === d.active)) ? d.active : WS.list[0].id;
  saveWS();
  snapCache = null; snapsReady = false;
  S = projState(WS.active) || defaultState();
  if (!S.pid) S.pid = WS.active;
  S.view = 'dash';
  initSnaps();
  flushSave(); render();
}

function importJson(file) {
  const fr = new FileReader();
  fr.onload = () => {
    try {
      const d = JSON.parse(fr.result);
      wsEmpty = false;
      // 工作区备份（多项目）
      if (d && d.kind === 'workspace' && Array.isArray(d.projects)) {
        if (!confirm(`导入将覆盖当前全部 ${WS.list.length} 个项目（备份中含 ${d.projects.length} 个项目），确定继续？`)) return;
        applyWorkspace(d);
        toast(`导入成功：${WS.list.length} 个项目`);
        return;
      }
      // 单项目（旧版备份 / 单项目 JSON）→ 导入为新项目，不覆盖现有
      if (!d || typeof d !== 'object' || !d.items) throw new Error('格式不符');
      const st = migrate(d);
      st.pid = uid(); st.view = 'dash';
      WS.list.push({id: st.pid, created: Date.now()});
      WS.active = st.pid; saveWS();
      try { localStorage.setItem(projKey(st.pid), JSON.stringify(st)); } catch (e) {}
      pendingEmbed = null;
      snapCache = null; snapsReady = false;
      S = st;
      initSnaps(); flushSave(); render();
      toast('已导入为新项目：' + (st.meta.name || '未命名'));
    } catch (err) {
      alert('导入失败：文件不是有效的看板备份。');
    }
  };
  fr.readAsText(file);
}

function boot() {
  S = load();
  if (!S.view) S.view = 'dash';
  if (!S.backup) S.backup = defaultState().backup;

  // 自动每周生成周报草稿
  try {
    const made = ensureAutoWeekly();
    if (made) autoWeeklyNotice = made.key;
  } catch (e) {}

  // 启动定时自动备份
  startAutoBackup();

  // 加载快照（IndexedDB 优先，自动迁移旧 localStorage 快照释放空间）
  initSnaps().then(() => { if (S.view === 'vault') render(); });

  // 读取浏览器存储配额
  if (navigator.storage && navigator.storage.estimate) {
    navigator.storage.estimate().then(e => {
      if (e && e.quota) {
        storageQuota = {used: e.usage || 0, quota: e.quota};
        if (S.view === 'vault') render();
      }
    }).catch(() => {});
  }

  // 退出 / 切后台 / 刷新前紧急落盘，防止卡死或断电丢数据
  window.addEventListener('beforeunload', flushNow);
  window.addEventListener('pagehide', flushNow);
  document.addEventListener('visibilitychange', () => { if (document.hidden) flushNow(); });

  // 尝试恢复上次授权的数据文件夹
  restoreFolder().then(() => { if (dirHandle) render(); });

  $('#btnExport') && $('#btnExport').addEventListener('click', exportJson);
  $('#btnShare').addEventListener('click', shareModal);
  $('#btnVault').addEventListener('click', () => go('vault'));
  $('#btnUser').addEventListener('click', loginModal);
  $('#btnImport').addEventListener('click', () => $('#fileInput').click());
  $('#btnNewProj').addEventListener('click', newProjectModal);
  const psEl = $('#projSwitch');
  if (psEl) psEl.addEventListener('change', e => switchProject(e.target.value));
  $('#fileInput').addEventListener('change', ev => {
    const f = ev.target.files[0];
    if (f) importJson(f);
    ev.target.value = '';
  });
  $('#btnLog').addEventListener('click', () => {
    S.view = 'logs'; save(); render();
    setTimeout(() => { const d = $('#lDate'); if (d) d.focus(); }, 60);
  });
  $('#projName').addEventListener('click', openMetaModal);
  $('#projName').style.cursor = 'pointer';
  $('#projName').title = '点击编辑项目信息';
  $('#menuBtn').addEventListener('click', () => $('#side').classList.toggle('open'));

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
    if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); exportJson(); }
  });

  render();
}

/* 页面原始 HTML（DOM 渲染前捕获），用于导出自包含的分发文件 */
const RAW_HTML = document.documentElement.outerHTML;

boot();




