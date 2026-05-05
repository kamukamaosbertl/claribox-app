import 'package:flutter/material.dart';
import 'dart:async';
import 'dart:math' as math;
import 'dart:ui';

// ─────────────────────────────────────────────
//  Design Tokens (mirrors HomeScreen)
// ─────────────────────────────────────────────
class _C {
  static const bg = Color(0xFF0A1628);
  static const primary = Color(0xFF1A56DB);
  static const accent = Color(0xFF38BDF8);
  static const success = Color(0xFF34D399);
  static const textHi = Colors.white;
  static const textLo = Color(0xFF4A6FA5);
  static const glass = Color(0x0DFFFFFF);
  static const glassBorder = Color(0x1AFFFFFF);
}

// ─────────────────────────────────────────────
//  SplashScreen
// ─────────────────────────────────────────────
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with TickerProviderStateMixin {
  // ── Unchanged logic ───────────────────────
  late AnimationController _fadeController;
  late Animation<double> _fadeAnimation;

  // ── New visual controllers ─────────────────
  late AnimationController _orbController; // ambient background orbs
  late AnimationController _pulseController; // logo ring pulse
  late AnimationController _shimmerController; // loading bar shimmer
  late AnimationController _slideController; // text slide-up

  late Animation<double> _pulseAnim;
  late Animation<double> _slideAnim;
  late Animation<double> _shimmerAnim;

  @override
  void initState() {
    super.initState();

    // ── 1. Fade-in (UNCHANGED logic) ─────────
    _fadeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );
    _fadeAnimation = CurvedAnimation(
      parent: _fadeController,
      curve: Curves.easeOut,
    );
    _fadeController.forward();

    // ── 2. Navigate after delay (UNCHANGED) ──
    Timer(const Duration(seconds: 3), () {
      if (!mounted) return;
      Navigator.pushReplacementNamed(context, '/home');
    });

    // ── 3. Ambient orb animation ──────────────
    _orbController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 8),
    )..repeat();

    // ── 4. Logo ring pulse ────────────────────
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    )..repeat(reverse: true);
    _pulseAnim = Tween<double>(begin: 0.85, end: 1.0).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    // ── 5. Text slide-up ──────────────────────
    _slideController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    );
    _slideAnim = Tween<double>(
      begin: 24,
      end: 0,
    ).animate(CurvedAnimation(parent: _slideController, curve: Curves.easeOut));
    Future.delayed(const Duration(milliseconds: 300), () {
      if (mounted) _slideController.forward();
    });

    // ── 6. Shimmer on loading bar ─────────────
    _shimmerController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )..repeat();
    _shimmerAnim = Tween<double>(begin: -1, end: 2).animate(
      CurvedAnimation(parent: _shimmerController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _fadeController.dispose();
    _orbController.dispose();
    _pulseController.dispose();
    _slideController.dispose();
    _shimmerController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    return Scaffold(
      backgroundColor: _C.bg,
      body: Stack(
        children: [
          // ── Ambient background ──────────────
          AnimatedBuilder(
            animation: _orbController,
            builder:
                (_, __) => CustomPaint(
                  size: size,
                  painter: _OrbPainter(_orbController.value * 2 * math.pi),
                ),
          ),

          // ── Main content fade-in ────────────
          FadeTransition(
            opacity: _fadeAnimation,
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _buildLogo(),
                  const SizedBox(height: 36),
                  _buildWordmark(),
                  const SizedBox(height: 72),
                  _buildLoadingBar(size),
                  const SizedBox(height: 20),
                  _buildFootnote(),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── Logo ─────────────────────────────────────
  Widget _buildLogo() {
    return AnimatedBuilder(
      animation: _pulseAnim,
      builder:
          (_, child) => Stack(
            alignment: Alignment.center,
            children: [
              // Outer glow ring
              Transform.scale(
                scale: _pulseAnim.value * 1.18,
                child: Container(
                  width: 120,
                  height: 120,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: _C.accent.withOpacity(0.08 * _pulseAnim.value),
                      width: 1.5,
                    ),
                  ),
                ),
              ),
              // Mid ring
              Transform.scale(
                scale: _pulseAnim.value * 1.05,
                child: Container(
                  width: 120,
                  height: 120,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: _C.accent.withOpacity(0.15),
                      width: 1,
                    ),
                  ),
                ),
              ),
              // Logo container
              ClipRRect(
                borderRadius: BorderRadius.circular(60),
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
                  child: Container(
                    width: 110,
                    height: 110,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: RadialGradient(
                        colors: [
                          _C.primary.withOpacity(0.5),
                          _C.bg.withOpacity(0.8),
                        ],
                      ),
                      border: Border.all(color: _C.glassBorder, width: 1.5),
                      boxShadow: [
                        BoxShadow(
                          color: _C.accent.withOpacity(0.2),
                          blurRadius: 32,
                          spreadRadius: 2,
                        ),
                      ],
                    ),
                    child: Center(
                      child: Image.asset(
                        'assets/f5.png',
                        width: 58,
                        height: 58,
                        errorBuilder:
                            (_, __, ___) => const Icon(
                              Icons.shield_outlined,
                              color: _C.accent,
                              size: 44,
                            ),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
    );
  }

  // ── Wordmark ──────────────────────────────────
  Widget _buildWordmark() {
    return AnimatedBuilder(
      animation: _slideAnim,
      builder:
          (_, child) => Transform.translate(
            offset: Offset(0, _slideAnim.value),
            child: child,
          ),
      child: Column(
        children: [
          // CLARIBOX — gradient text
          ShaderMask(
            shaderCallback:
                (bounds) => const LinearGradient(
                  colors: [_C.textHi, _C.accent],
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                ).createShader(bounds),
            child: const Text(
              'CLARIBOX',
              style: TextStyle(
                fontFamily: 'Courier',
                color: Colors.white, // masked by shader
                fontSize: 34,
                fontWeight: FontWeight.w900,
                letterSpacing: 6,
              ),
            ),
          ),
          const SizedBox(height: 10),
          // Tagline
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 20,
                height: 1,
                color: _C.textLo.withOpacity(0.4),
              ),
              const SizedBox(width: 10),
              Text(
                'YOUR VOICE, ANONYMOUSLY',
                style: TextStyle(
                  fontFamily: 'Courier',
                  color: _C.textLo.withOpacity(0.7),
                  fontSize: 9,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 2.5,
                ),
              ),
              const SizedBox(width: 10),
              Container(
                width: 20,
                height: 1,
                color: _C.textLo.withOpacity(0.4),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ── Shimmer loading bar ───────────────────────
  Widget _buildLoadingBar(Size size) {
    const barWidth = 120.0;
    const barHeight = 2.0;

    return AnimatedBuilder(
      animation: _shimmerAnim,
      builder: (_, __) {
        return SizedBox(
          width: barWidth,
          height: barHeight,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(2),
            child: Stack(
              children: [
                // Track
                Container(color: _C.glassBorder),
                // Shimmer
                FractionallySizedBox(
                  widthFactor: 1,
                  child: CustomPaint(
                    painter: _ShimmerPainter(_shimmerAnim.value),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  // ── Footnote ──────────────────────────────────
  Widget _buildFootnote() {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 5,
          height: 5,
          decoration: const BoxDecoration(
            color: _C.success,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 7),
        Text(
          'End-to-end encrypted',
          style: TextStyle(
            fontFamily: 'Courier',
            color: _C.textLo.withOpacity(0.6),
            fontSize: 10,
            letterSpacing: 1.2,
          ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────
//  Ambient Orb Painter
// ─────────────────────────────────────────────
class _OrbPainter extends CustomPainter {
  final double t;
  _OrbPainter(this.t);

  @override
  void paint(Canvas canvas, Size size) {
    final p1 = Offset(
      size.width * 0.75 + math.sin(t) * 30,
      size.height * 0.25 + math.cos(t * 0.7) * 25,
    );
    canvas.drawCircle(
      p1,
      220,
      Paint()
        ..shader = RadialGradient(
          colors: [const Color(0x301A56DB), Colors.transparent],
        ).createShader(Rect.fromCircle(center: p1, radius: 220)),
    );

    final p2 = Offset(
      size.width * 0.2 + math.cos(t * 0.6) * 28,
      size.height * 0.72 + math.sin(t * 0.8) * 22,
    );
    canvas.drawCircle(
      p2,
      180,
      Paint()
        ..shader = RadialGradient(
          colors: [const Color(0x2038BDF8), Colors.transparent],
        ).createShader(Rect.fromCircle(center: p2, radius: 180)),
    );

    final p3 = Offset(
      size.width * 0.5 + math.sin(t * 0.35 + 1) * 18,
      size.height * 0.5 + math.cos(t * 0.5) * 18,
    );
    canvas.drawCircle(
      p3,
      100,
      Paint()
        ..shader = RadialGradient(
          colors: [const Color(0x1234D399), Colors.transparent],
        ).createShader(Rect.fromCircle(center: p3, radius: 100)),
    );
  }

  @override
  bool shouldRepaint(_OrbPainter old) => old.t != t;
}

// ─────────────────────────────────────────────
//  Shimmer Painter
// ─────────────────────────────────────────────
class _ShimmerPainter extends CustomPainter {
  final double progress; // -1 to 2
  _ShimmerPainter(this.progress);

  @override
  void paint(Canvas canvas, Size size) {
    final shimmerX = progress * size.width;
    final paint =
        Paint()
          ..shader = LinearGradient(
            colors: [
              Colors.transparent,
              const Color(0xFF38BDF8).withOpacity(0.9),
              Colors.transparent,
            ],
            stops: const [0.0, 0.5, 1.0],
            begin: Alignment.centerLeft,
            end: Alignment.centerRight,
          ).createShader(Rect.fromLTWH(shimmerX - 40, 0, 80, size.height));

    canvas.drawRect(Rect.fromLTWH(shimmerX - 40, 0, 80, size.height), paint);
  }

  @override
  bool shouldRepaint(_ShimmerPainter old) => old.progress != progress;
}
