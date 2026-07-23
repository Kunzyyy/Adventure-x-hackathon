/* ============================================================
   Keal — AI Career OS
   JavaScript Application
   ============================================================ */

(function () {
  'use strict';

  // Detect current page
  const path = window.location.pathname;
  const pageName = path.substring(path.lastIndexOf('/') + 1).replace('.html', '') || 'index';

  /* ==========================================================
     INIT
     ========================================================== */
  document.addEventListener('DOMContentLoaded', () => {
    initScrollReveal();
    initCounterAnimation();

    if (pageName === 'index' || pageName === '') {
      initHeroLight();
      initThreeJS();
    }

    if (pageName === 'resume') {
      initResumePage();
    }

    if (pageName === 'interview') {
      initInterviewPage();
    }
  });

  /* ==========================================================
     SCROLL REVEAL (Intersection Observer)
     ========================================================== */
  function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal');

    if (!reveals.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Small stagger based on transition-delay if set
            const delay = entry.target.style.transitionDelay || '0s';
            setTimeout(() => {
              entry.target.classList.add('visible');
            }, parseFloat(delay) * 1000);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    reveals.forEach((el) => observer.observe(el));
  }

  /* ==========================================================
     COUNTER ANIMATION — Enterprise Stats
     ========================================================== */
  function initCounterAnimation() {
    const counters = document.querySelectorAll('.ent-stat-value[data-count]');
    if (!counters.length) return;

    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach((el) => counterObserver.observe(el));
  }

  function animateCounter(el) {
    const target = parseInt(el.getAttribute('data-count'), 10);
    if (isNaN(target)) return;

    const duration = 1600;
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * target);
      el.textContent = current.toLocaleString();
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target.toLocaleString();
    };
    requestAnimationFrame(step);
  }

  /* ==========================================================
     HERO MOUSE LIGHT EFFECT
     ========================================================== */
  function initHeroLight() {
    const hero = document.getElementById('heroSection');
    const light = document.getElementById('heroLight');
    if (!hero || !light) return;

    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      light.style.left = x + 'px';
      light.style.top = y + 'px';
      light.style.opacity = '1';
    });

    hero.addEventListener('mouseleave', () => {
      light.style.opacity = '0';
    });
  }

  /* ==========================================================
     THREE.JS — 3D AI MASCOT
     ========================================================== */
  async function initThreeJS() {
    const container = document.getElementById('three-canvas');
    if (!container) return;

    try {
      const THREE = await import('three');
      initThreeScene(THREE, container);
    } catch (err) {
      console.warn('Three.js 加载失败，使用静态占位:', err.message);
      container.innerHTML =
        '<div style="width:200px;height:200px;border-radius:50%;background:var(--accent-gradient);display:flex;align-items:center;justify-content:center;font-size:60px;box-shadow:0 8px 40px rgba(99,102,241,0.35);animation:float 3s ease-in-out infinite;margin:0 auto;">🤖</div>';
    }
  }

  function initThreeScene(THREE, container) {
    // Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xF8FAFC, 2, 7);

    // Camera
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 15);
    camera.position.set(0, 0.3, 6);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(360, 360);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 1.5));

    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(3, 4, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(512, 512);
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 20;
    key.shadow.bias = -0.0002;
    scene.add(key);

    const fill = new THREE.DirectionalLight(0x6366F1, 1.0);
    fill.position.set(-2, 0.3, -1);
    scene.add(fill);

    scene.add(new THREE.PointLight(0x8B5CF6, 0.8, 5, 2));

    // Ground shadow
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(6, 6),
      new THREE.ShadowMaterial({ opacity: 0.18 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Robot group
    const robot = new THREE.Group();
    scene.add(robot);

    // Head
    const headMat = new THREE.MeshStandardMaterial({ color: 0x1A1A2E, roughness: 0.22, metalness: 0.08 });
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.6, 64, 64), headMat);
    head.position.y = 0.85;
    head.castShadow = true;
    head.receiveShadow = true;
    robot.add(head);

    // Visor
    const visorMat = new THREE.MeshStandardMaterial({
      color: 0x6366F1, roughness: 0.18, metalness: 0.05,
      emissive: 0x6366F1, emissiveIntensity: 0.55,
    });
    const visor = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.055, 32, 64), visorMat);
    visor.position.set(0, 0.85, 0.38);
    robot.add(visor);

    // Eyes
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF, roughness: 0.05,
      emissive: 0xFFFFFF, emissiveIntensity: 0.9,
    });
    const eyeG = new THREE.SphereGeometry(0.07, 32, 32);
    const leftEye = new THREE.Mesh(eyeG, eyeMat);
    leftEye.position.set(-0.16, 0.93, 0.46);
    robot.add(leftEye);
    const rightEye = new THREE.Mesh(eyeG, eyeMat);
    rightEye.position.set(0.16, 0.93, 0.46);
    robot.add(rightEye);

    // Body
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.32, 0.65, 8, 32),
      new THREE.MeshStandardMaterial({ color: 0x1A1A2E, roughness: 0.22, metalness: 0.12 })
    );
    body.position.y = -0.06;
    body.castShadow = true;
    body.receiveShadow = true;
    robot.add(body);

    // Chest ring
    const chestRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.25, 0.025, 16, 48),
      new THREE.MeshStandardMaterial({ color: 0x8B5CF6, roughness: 0.15, emissive: 0x8B5CF6, emissiveIntensity: 0.3 })
    );
    chestRing.position.y = 0.05;
    chestRing.rotation.x = Math.PI / 2;
    robot.add(chestRing);

    // Halo
    const haloGroup = new THREE.Group();
    haloGroup.position.y = 0.85;
    robot.add(haloGroup);

    const haloMat1 = new THREE.MeshStandardMaterial({
      color: 0xA78BFA, roughness: 0.08, metalness: 0.1,
      emissive: 0xA78BFA, emissiveIntensity: 0.45,
    });
    const halo1 = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.014, 16, 100), haloMat1);
    halo1.rotation.x = Math.PI / 3;
    haloGroup.add(halo1);

    const halo2 = new THREE.Mesh(
      new THREE.TorusGeometry(0.78, 0.011, 16, 80),
      new THREE.MeshStandardMaterial({ color: 0x6366F1, roughness: 0.08, emissive: 0x6366F1, emissiveIntensity: 0.3 })
    );
    halo2.rotation.x = -Math.PI / 4;
    halo2.rotation.y = Math.PI / 2;
    haloGroup.add(halo2);

    // Floating particles
    const particlesGroup = new THREE.Group();
    scene.add(particlesGroup);
    const pGeo = new THREE.SphereGeometry(0.025, 8, 8);
    const pMat = new THREE.MeshStandardMaterial({ color: 0x8B5CF6, roughness: 0.2, emissive: 0x8B5CF6, emissiveIntensity: 0.4 });
    const particles = [];

    for (let i = 0; i < 18; i++) {
      const p = new THREE.Mesh(pGeo, pMat);
      const angle = (i / 18) * Math.PI * 2;
      const r = 1.3 + Math.random() * 0.5;
      p.position.set(Math.cos(angle) * r, (Math.random() - 0.5) * 2.8, Math.sin(angle) * r);
      p.userData = {
        baseX: p.position.x, baseY: p.position.y, baseZ: p.position.z,
        speed: 0.3 + Math.random() * 0.6,
        amp: 0.08 + Math.random() * 0.25,
        offset: Math.random() * Math.PI * 2,
      };
      particles.push(p);
      particlesGroup.add(p);
    }

    // Mouse interaction
    let mouseX = 0, mouseY = 0, targetMX = 0, targetMY = 0;

    container.addEventListener('mousemove', (e) => {
      const rect = container.getBoundingClientRect();
      targetMX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      targetMY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    });

    container.addEventListener('mouseleave', () => {
      targetMX = 0;
      targetMY = 0;
    });

    // Animation
    const clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);

      const dt = Math.min(clock.getDelta(), 0.1);
      const t = performance.now() * 0.001;

      mouseX += (targetMX - mouseX) * 4 * dt;
      mouseY += (targetMY - mouseY) * 4 * dt;

      robot.rotation.y += 0.28 * dt;
      robot.position.y = Math.sin(t * 0.75) * 0.12;

      head.rotation.x = mouseY * 0.12;
      head.rotation.y = mouseX * 0.12;

      haloGroup.rotation.y += 0.45 * dt;
      haloGroup.rotation.z += 0.18 * dt;

      particles.forEach((p) => {
        const u = p.userData;
        p.position.y = u.baseY + Math.sin(t * u.speed + u.offset) * u.amp;
        p.position.x = u.baseX + Math.cos(t * u.speed * 0.7 + u.offset) * u.amp * 0.5;
      });
      particlesGroup.rotation.y += 0.08 * dt;

      visor.material.emissiveIntensity = 0.45 + Math.sin(t * 1.8) * 0.12;

      renderer.render(scene, camera);
    }
    animate();

    // Resize
    window.addEventListener('resize', () => {
      const w = container.clientWidth || 360;
      const h = Math.min(w, 360);
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
  }

  /* ==========================================================
     RESUME PAGE LOGIC
     ========================================================== */
  function initResumePage() {
    const btn = document.getElementById('optimizeBtn');
    if (btn) {
      btn.addEventListener('click', optimizeResume);
    }
  }

  // History data
  const resumeHistoryData = [
    {
      input: '参加过一个AI小程序开发比赛，获得了二等奖。',
      output: '主导开发AI智能小程序项目，在XX大赛中从200+团队中脱颖而出，荣获二等奖。项目实现用户需求智能分析与个性化推荐，累计服务用户5000+人次。',
      score: 92,
      kw: '95%',
      pro: '90%',
    },
    {
      input: '在学生会做活动策划，组织过几场活动。',
      output: '担任学生会活动策划核心成员，统筹策划并执行校园大型活动5场，单场参与人数最高达800人。擅长跨部门协作与资源调度，活动满意度达94%。',
      score: 88,
      kw: '89%',
      pro: '87%',
    },
  ];

  window.loadHistory = function (index) {
    const item = resumeHistoryData[index];
    if (!item) return;
    document.getElementById('resumeInput').value = item.input;
  };

  window.optimizeResume = function () {
    const inputEl = document.getElementById('resumeInput');
    const outputEl = document.getElementById('aiOutput');
    const scoreDisplay = document.getElementById('scoreDisplay');
    const fillRing = document.getElementById('fillRing');
    const scoreValue = document.getElementById('scoreValue');
    const kwScore = document.getElementById('kwScore');
    const proScore = document.getElementById('proScore');
    const btn = document.getElementById('optimizeBtn');

    const input = inputEl.value.trim();
    if (!input) {
      outputEl.innerHTML = '<span style="color:#EF4444;">请先输入你的经历描述。</span>';
      return;
    }

    // Loading state
    btn.disabled = true;
    btn.textContent = '⏳ 分析中...';
    outputEl.innerHTML =
      '<div class="typing-dots"><span></span><span></span><span></span></div>';

    // Simulate AI processing
    setTimeout(() => {
      // Generate optimized text based on input
      let optimized = generateOptimizedText(input);

      outputEl.innerHTML =
        '<div style="font-size:13px;color:var(--accent-500);font-weight:600;margin-bottom:8px;">✨ AI 优化版本</div>' +
        optimized;

      // Show score
      const score = Math.floor(78 + Math.random() * 16); // 78-93
      const kw = Math.floor(82 + Math.random() * 16);
      const pro = Math.floor(75 + Math.random() * 18);

      scoreDisplay.style.opacity = '1';
      scoreValue.textContent = score;
      kwScore.textContent = kw + '%';
      proScore.textContent = pro + '%';

      // Animate ring
      const circumference = 2 * Math.PI * 26;
      const offset = circumference - (score / 100) * circumference;
      fillRing.style.strokeDasharray = circumference;
      fillRing.style.strokeDashoffset = offset;

      btn.disabled = false;
      btn.textContent = '✨ AI 优化';
    }, 1400 + Math.random() * 600);
  };

  function generateOptimizedText(input) {
    // Simple but realistic optimization logic
    const patterns = [
      { from: /负责(.{1,10})公众号运营/g, to: '负责<span class="highlight-text">$1公众号内容运营</span>，通过<span class="highlight-text">数据分析优化内容策略</span>，实现粉丝增长<span class="highlight-text">35%</span>' },
      { from: /每周发布文章/g, to: '<span class="highlight-text">保持高频内容输出</span>，持续提升品牌影响力' },
      { from: /活动推广/g, to: '<span class="highlight-text">策划并执行线上+线下整合营销活动</span>' },
      { from: /我负责/g, to: '<span class="highlight-text">主导</span>' },
      { from: /做一些/g, to: '<span class="highlight-text">策划并执行</span>' },
    ];

    let result = input;
    let matched = false;
    for (const p of patterns) {
      if (p.from.test(result)) {
        result = result.replace(p.from, p.to);
        matched = true;
      }
    }

    if (!matched) {
      // Generic optimization
      const keywords = ['数据分析', '用户增长', '产品优化', '团队协作', '项目落地'];
      const picked = keywords.sort(() => Math.random() - 0.5).slice(0, 2);
      result =
        '<span class="highlight-text">' + picked[0] + '</span>驱动的' +
        result.replace(/。/g, '。') +
        '通过<span class="highlight-text">' + picked[1] + '</span>实现关键指标提升。';
    }

    // Clean up multiple periods
    result = result.replace(/。。/g, '。').replace(/\.\./g, '.');

    // Add quantifiable result if missing
    if (!result.includes('%') && !result.includes('倍') && !result.includes('人')) {
      const metrics = ['参与度提升28%', '转化率提高15%', '覆盖用户增长42%'];
      result += ' ' + metrics[Math.floor(Math.random() * metrics.length)] + '。';
    }

    return result;
  }

  /* ==========================================================
     INTERVIEW PAGE LOGIC
     ========================================================== */
  function initInterviewPage() {
    // Setup done, interaction handled by global functions
  }

  // Interview questions bank
  const interviewQuestions = [
    '请介绍一下你自己。',
    '你为什么选择这个岗位？',
    '描述一次你解决复杂问题的经历。',
    '你对未来的职业规划是什么？',
    '你最大的优点和缺点分别是什么？',
  ];

  let currentQIndex = 0;
  let answeredCount = 0;
  let totalScores = { express: 0, logic: 0, match: 0 };

  window.submitAnswer = function () {
    const input = document.getElementById('answerInput');
    const submitBtn = document.getElementById('submitBtn');
    const questionBubble = document.getElementById('questionBubble');
    const typingDots = document.getElementById('typingDots');
    const feedbackCard = document.getElementById('feedbackCard');
    const qIndex = document.getElementById('qIndex');
    const answer = input.value.trim();

    if (!answer) return;

    // Disable input
    input.disabled = true;
    submitBtn.disabled = true;
    submitBtn.textContent = '...';

    // Show typing indicator
    typingDots.style.display = 'block';

    // Generate feedback after delay
    setTimeout(() => {
      typingDots.style.display = 'none';

      // Random but realistic scores
      const express = Math.floor(72 + Math.random() * 22);
      const logic = Math.floor(68 + Math.random() * 26);
      const match = Math.floor(78 + Math.random() * 18);

      // Update feedback
      document.getElementById('fbExpress').textContent = express;
      document.getElementById('fbLogic').textContent = logic;
      document.getElementById('fbMatch').textContent = match;
      document.getElementById('fbExpressBar').style.width = express + '%';
      document.getElementById('fbLogicBar').style.width = logic + '%';
      document.getElementById('fbMatchBar').style.width = match + '%';

      // Accumulate scores
      totalScores.express += express;
      totalScores.logic += logic;
      totalScores.match += match;
      answeredCount++;

      // Show feedback card
      feedbackCard.classList.add('visible');

      // Generate advice
      const adviceEl = document.getElementById('feedbackAdvice');
      const advices = generateAdvice(express, logic, match);
      adviceEl.innerHTML =
        '<strong>改进建议：</strong><br>' + advices.join('<br>');

      // Move to next question
      currentQIndex++;
      if (currentQIndex < interviewQuestions.length) {
        setTimeout(() => {
          questionBubble.textContent = interviewQuestions[currentQIndex];
          qIndex.textContent = currentQIndex + 1;
          input.value = '';
          input.disabled = false;
          submitBtn.disabled = false;
          submitBtn.textContent = '发送';
          input.focus();
        }, 2000);
      } else {
        // Interview complete
        const avgExpress = Math.round(totalScores.express / answeredCount);
        const avgLogic = Math.round(totalScores.logic / answeredCount);
        const avgMatch = Math.round(totalScores.match / answeredCount);

        questionBubble.textContent =
          '面试结束！你的综合表现非常出色，AI 已生成完整评价报告。';
        qIndex.textContent = '完成';
        input.disabled = true;
        submitBtn.textContent = '已完成';
        input.value = '';

        document.getElementById('fbExpress').textContent = avgExpress;
        document.getElementById('fbLogic').textContent = avgLogic;
        document.getElementById('fbMatch').textContent = avgMatch;
        document.getElementById('fbExpressBar').style.width = avgExpress + '%';
        document.getElementById('fbLogicBar').style.width = avgLogic + '%';
        document.getElementById('fbMatchBar').style.width = avgMatch + '%';

        const finalAdvice = document.getElementById('feedbackAdvice');
        finalAdvice.innerHTML =
          '<strong>🎉 面试完成！综合评分</strong><br><br>' +
          '• 整体表达能力优秀，继续保持结构化回答<br>' +
          '• 逻辑清晰度良好，建议多用「STAR法则」组织答案<br>' +
          '• 岗位匹配度高，项目经验与目标岗位高度吻合<br><br>' +
          '<strong>下一步：</strong>查看完整报告，针对性提升薄弱环节。';
      }
    }, 1500 + Math.random() * 800);
  };

  function generateAdvice(express, logic, match) {
    const advices = [];
    if (express < 78) advices.push('• 回答时可以更有条理，使用「首先...其次...最后」结构');
    else advices.push('• 表达清晰流畅，继续保持结构化表达风格');
    if (logic < 75) advices.push('• 建议使用具体数据或案例支撑观点');
    else advices.push('• 逻辑严密，论据充分');
    if (match < 82) advices.push('• 可以更多结合岗位JD中的关键词来回答');
    else advices.push('• 回答与目标岗位契合度高');
    return advices.length ? advices : ['• 表现优秀，继续保持！'];
  }

  /* ==========================================================
     UTILS: Scroll to section
     ========================================================== */
  window.scrollToSection = function (id) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  console.log('✨ Keal AI Career OS ready — page:', pageName);
})();
