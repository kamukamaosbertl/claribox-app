import 'dart:io';
import 'dart:ui';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';
import 'package:lucide_icons/lucide_icons.dart';

// ─────────────────────────────────────────────
//  Design Tokens
// ─────────────────────────────────────────────
class _C {
  static const bg = Color(0xFF0A1628);
  static const surface = Color(0xFF0F1F3D);
  static const primary = Color(0xFF1A56DB);
  static const accent = Color(0xFF38BDF8);
  static const success = Color(0xFF34D399);
  static const error = Color(0xFFF87171);
  static const textHi = Colors.white;
  static const textMid = Color(0xFFAEC3E8);
  static const textLo = Color(0xFF4A6FA5);
  static const glass = Color(0x0DFFFFFF);
  static const glassBorder = Color(0x1AFFFFFF);
  static const inputFill = Color(0x14FFFFFF);
}

class _T {
  static const heading = TextStyle(
    fontFamily: 'Georgia',
    color: _C.textHi,
    fontWeight: FontWeight.w900,
    letterSpacing: -0.5,
    height: 1.1,
  );

  static const body = TextStyle(
    fontFamily: 'Georgia',
    color: _C.textMid,
    fontWeight: FontWeight.w400,
    height: 1.5,
  );

  static const mono = TextStyle(
    fontFamily: 'Courier',
    color: _C.accent,
    fontWeight: FontWeight.w700,
    letterSpacing: 3,
    fontSize: 12,
  );

  static const label = TextStyle(
    fontFamily: 'Georgia',
    color: _C.textMid,
    fontSize: 13,
    fontWeight: FontWeight.w600,
  );
}

// ─────────────────────────────────────────────
//  SubmitFeedbackScreen
// ─────────────────────────────────────────────
class SubmitFeedbackScreen extends StatefulWidget {
  const SubmitFeedbackScreen({super.key});

  @override
  State<SubmitFeedbackScreen> createState() => _SubmitFeedbackScreenState();
}

class _SubmitFeedbackScreenState extends State<SubmitFeedbackScreen>
    with SingleTickerProviderStateMixin {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _feedbackController = TextEditingController();
  final TextEditingController _ipController = TextEditingController();
  final ApiService _apiService = ApiService();

  File? _selectedFile;
  bool _isLoading = false;
  bool _isSuccess = false;
  int _wordCount = 0;

  static const int _maxFileSizeBytes = 5 * 1024 * 1024;

  late AnimationController _orb;

  @override
  void initState() {
    super.initState();

    _feedbackController.addListener(_updateWordCount);

    _orb = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 10),
    )..repeat();
  }

  void _updateWordCount() {
    final text = _feedbackController.text.trim();

    setState(() {
      _wordCount = text.isEmpty ? 0 : text.split(RegExp(r'\s+')).length;
    });
  }

  @override
  void dispose() {
    _feedbackController.dispose();
    _ipController.dispose();
    _orb.dispose();
    super.dispose();
  }

  Future<void> _showIpSettings() async {
    final prefs = await SharedPreferences.getInstance();
    _ipController.text = prefs.getString('backend_ip') ?? '';

    if (!mounted) return;

    await showDialog<void>(
      context: context,
      builder: (dialogContext) => _buildSettingsDialog(dialogContext, prefs),
    );
  }

  Future<void> _pickFile() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['jpg', 'jpeg', 'png', 'pdf'],
      );

      if (result == null) return;

      final picked = result.files.single;

      if (picked.path == null) {
        _showSnackBar('Could not read selected file.');
        return;
      }

      if (picked.size > _maxFileSizeBytes) {
        _showSnackBar('File is too large. Maximum size is 5MB.');
        return;
      }

      setState(() => _selectedFile = File(picked.path!));
    } catch (_) {
      _showSnackBar('Error picking file.');
    }
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    if (_wordCount > 1000) {
      _showSnackBar('Please reduce your feedback to under 1000 words.');
      return;
    }

    FocusScope.of(context).unfocus();

    setState(() => _isLoading = true);

    try {
      final success = await _apiService.submitFeedback(
        feedback: _feedbackController.text.trim(),
        evidenceFile: _selectedFile,
      );

      if (!mounted) return;

      setState(() {
        _isLoading = false;
        _isSuccess = success;
      });

      if (!success) {
        _showSnackBar('Submission failed. Check your server.');
      }
    } catch (_) {
      if (!mounted) return;

      setState(() => _isLoading = false);
      _showSnackBar('Connection error. Is the server running?');
    }
  }

  void _resetForm() {
    setState(() {
      _isSuccess = false;
      _selectedFile = null;
      _feedbackController.clear();
      _wordCount = 0;
    });
  }

  void _showSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message, style: _T.body.copyWith(color: _C.textHi)),
        backgroundColor: _C.surface,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.all(16),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isSuccess) return _buildSuccessUI();

    return Scaffold(
      backgroundColor: _C.bg,
      extendBodyBehindAppBar: true,
      appBar: _buildAppBar(),
      body: Stack(
        children: [
          _buildAmbientBackground(),
          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildHeader(),
                    const SizedBox(height: 32),

                    _buildSectionLabel(
                      'YOUR FEEDBACK',
                      LucideIcons.messageSquare,
                    ),
                    const SizedBox(height: 10),
                    _buildFeedbackField(),

                    const SizedBox(height: 28),

                    _buildSectionLabel('EVIDENCE', LucideIcons.paperclip),
                    const SizedBox(height: 10),
                    _buildFileSection(),

                    const SizedBox(height: 40),
                    _buildSubmitButton(),
                    const SizedBox(height: 16),
                    _buildPrivacyNote(),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: _buildBottomNav(),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      elevation: 0,
      backgroundColor: Colors.transparent,
      iconTheme: const IconThemeData(color: _C.textHi),
      centerTitle: true,
      title: Text('CLARIBOX', style: _T.mono.copyWith(fontSize: 14)),
      actions: [
        IconButton(
          icon: const Icon(LucideIcons.settings, size: 18, color: _C.textMid),
          onPressed: _showIpSettings,
        ),
        const SizedBox(width: 8),
      ],
    );
  }

  Widget _buildAmbientBackground() {
    return AnimatedBuilder(
      animation: _orb,
      builder: (_, __) {
        return SizedBox.expand(
          child: CustomPaint(
            painter: _OrbPainter(_orb.value * 2 * math.pi),
          ),
        );
      },
    );
  }

  Widget _buildHeader() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          "What's on\nyour mind?",
          style: _T.heading.copyWith(fontSize: 36),
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Container(
              width: 6,
              height: 6,
              decoration: const BoxDecoration(
                color: _C.success,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 8),
            Text(
              'Encrypted & anonymous — always',
              style: _T.body.copyWith(fontSize: 13, color: _C.textLo),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildSectionLabel(String text, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 13, color: _C.textLo),
        const SizedBox(width: 8),
        Text(
          text,
          style: _T.mono.copyWith(
            fontSize: 10,
            color: _C.textLo,
            letterSpacing: 2,
          ),
        ),
      ],
    );
  }

Widget _buildFeedbackField() {
  final overLimit = _wordCount > 1000;

  return ClipRRect(
    borderRadius: BorderRadius.circular(18),
    child: Container(
      decoration: BoxDecoration(
        // Light background so black typed text is visible
        color: Colors.white.withOpacity(0.95),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: overLimit ? _C.error.withOpacity(0.5) : _C.glassBorder,
        ),
      ),
      child: Column(
        children: [
          TextFormField(
            controller: _feedbackController,
            maxLines: 8,

            // This is the text people type
            style: _T.body.copyWith(
              color: Colors.black,
              fontSize: 15,
            ),

            // This is the blinking cursor
            cursorColor: Colors.black,

            decoration: InputDecoration(
              hintText: 'Tell us what happened — be specific...',

              // This is the placeholder text
              hintStyle: _T.body.copyWith(
                color: Colors.black45,
                fontSize: 14,
              ),

              contentPadding: const EdgeInsets.all(20),
              border: InputBorder.none,
              errorStyle: const TextStyle(height: 0),
            ),

            validator: (val) {
              if (val == null || val.trim().length < 10) {
                return 'Please be more descriptive, minimum 10 characters.';
              }

              if (_wordCount > 1000) {
                return 'Maximum 1000 words allowed.';
              }

              return null;
            },
          ),

          Container(
            padding: const EdgeInsets.fromLTRB(20, 10, 20, 14),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                if (_feedbackController.text.isNotEmpty)
                  GestureDetector(
                    onTap: () {
                      setState(() {
                        _feedbackController.clear();
                        _wordCount = 0;
                      });
                    },
                    child: Text(
                      'Clear',
                      style: _T.label.copyWith(
                        fontSize: 12,
                        color: Colors.black54,
                      ),
                    ),
                  )
                else
                  const SizedBox(),

                Text(
                  '$_wordCount / 1000',
                  style: _T.mono.copyWith(
                    fontSize: 10,
                    color: overLimit ? _C.error : Colors.black54,
                    letterSpacing: 1,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    ),
  );
}
  Widget _buildFileSection() {
    if (_selectedFile == null) {
      return GestureDetector(
        onTap: _isLoading ? null : _pickFile,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(18),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 28),
              decoration: BoxDecoration(
                color: _C.glass,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(
                  color: _C.accent.withOpacity(0.2),
                  style: BorderStyle.solid,
                ),
              ),
              child: Column(
                children: [
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: _C.accent.withOpacity(0.08),
                      shape: BoxShape.circle,
                      border: Border.all(color: _C.accent.withOpacity(0.15)),
                    ),
                    child: const Icon(
                      LucideIcons.uploadCloud,
                      color: _C.accent,
                      size: 24,
                    ),
                  ),
                  const SizedBox(height: 14),
                  Text(
                    'Upload Evidence',
                    style: _T.label.copyWith(color: _C.textHi, fontSize: 14),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'JPG, PNG or PDF — max 5MB',
                    style: _T.body.copyWith(fontSize: 11, color: _C.textLo),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }

    final fileName = _selectedFile!.path.split(Platform.pathSeparator).last;
    final ext = fileName.split('.').last.toUpperCase();

    return ClipRRect(
      borderRadius: BorderRadius.circular(18),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
          decoration: BoxDecoration(
            color: _C.success.withOpacity(0.06),
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: _C.success.withOpacity(0.2)),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: _C.success.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  ext,
                  style: _T.mono.copyWith(color: _C.success, fontSize: 10),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      fileName,
                      overflow: TextOverflow.ellipsis,
                      style: _T.label.copyWith(color: _C.textHi, fontSize: 14),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Ready to send',
                      style: _T.body.copyWith(fontSize: 11, color: _C.success),
                    ),
                  ],
                ),
              ),
              GestureDetector(
                onTap: () => setState(() => _selectedFile = null),
                child: Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: _C.error.withOpacity(0.08),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(LucideIcons.x, size: 14, color: _C.error),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSubmitButton() {
    return GestureDetector(
      onTap: _isLoading ? null : _handleSubmit,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        width: double.infinity,
        height: 58,
        decoration: BoxDecoration(
          gradient: _isLoading
              ? LinearGradient(
                  colors: [
                    _C.primary.withOpacity(0.5),
                    _C.accent.withOpacity(0.5),
                  ],
                )
              : const LinearGradient(
                  colors: [_C.primary, _C.accent],
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                ),
          borderRadius: BorderRadius.circular(18),
          boxShadow: _isLoading
              ? []
              : [
                  BoxShadow(
                    color: _C.accent.withOpacity(0.3),
                    blurRadius: 24,
                    offset: const Offset(0, 8),
                  ),
                ],
        ),
        child: Center(
          child: _isLoading
              ? const SizedBox(
                  width: 22,
                  height: 22,
                  child: CircularProgressIndicator(
                    color: Colors.white,
                    strokeWidth: 2.5,
                  ),
                )
              : Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(
                      LucideIcons.send,
                      size: 16,
                      color: Colors.white,
                    ),
                    const SizedBox(width: 10),
                    Text(
                      'SEND ANONYMOUSLY',
                      style: _T.mono.copyWith(
                        color: Colors.white,
                        fontSize: 13,
                        letterSpacing: 1.5,
                      ),
                    ),
                  ],
                ),
        ),
      ),
    );
  }

  Widget _buildPrivacyNote() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const Icon(LucideIcons.lock, size: 12, color: _C.textLo),
        const SizedBox(width: 6),
        Text(
          'No name, no trace — ever.',
          style: _T.body.copyWith(fontSize: 11, color: _C.textLo),
        ),
      ],
    );
  }

  Widget _buildSettingsDialog(
    BuildContext dialogContext,
    SharedPreferences prefs,
  ) {
    return Dialog(
      backgroundColor: const Color(0xFF0F1F3D),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'SERVER CONFIG',
              style: _T.mono.copyWith(fontSize: 10, color: _C.textLo),
            ),
            const SizedBox(height: 12),
            Text('Backend IP', style: _T.heading.copyWith(fontSize: 22)),
            const SizedBox(height: 20),
            TextField(
              controller: _ipController,
              style: _T.body.copyWith(color: _C.textHi),
              cursorColor: _C.accent,
              decoration: InputDecoration(
                hintText: 'e.g. 192.168.1.5',
                hintStyle: _T.body.copyWith(color: _C.textLo),
                filled: true,
                fillColor: _C.inputFill,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: _C.glassBorder),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: _C.glassBorder),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: _C.accent),
                ),
              ),
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(dialogContext),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: _C.glassBorder),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    child: Text(
                      'Cancel',
                      style: _T.label.copyWith(color: _C.textMid),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: GestureDetector(
                    onTap: () async {
                      final ip = _ipController.text.trim();

                      if (ip.isNotEmpty) {
                        await prefs.setString('backend_ip', ip);

                        if (!mounted) return;

                        Navigator.pop(dialogContext);
                        _showSnackBar('Server IP updated to: $ip');
                      }
                    },
                    child: Container(
                      height: 48,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [_C.primary, _C.accent],
                        ),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Center(
                        child: Text(
                          'Save',
                          style: _T.label.copyWith(color: Colors.white),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomNav() {
    return ClipRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: Container(
          decoration: const BoxDecoration(
            color: Color(0xCC0A1628),
            border: Border(top: BorderSide(color: _C.glassBorder)),
          ),
          child: BottomNavigationBar(
            currentIndex: 1,
            backgroundColor: Colors.transparent,
            selectedItemColor: _C.accent,
            unselectedItemColor: _C.textLo,
            showSelectedLabels: true,
            showUnselectedLabels: true,
            type: BottomNavigationBarType.fixed,
            elevation: 0,
            selectedLabelStyle: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.5,
            ),
            unselectedLabelStyle: const TextStyle(fontSize: 11),
            onTap: (index) {
              if (index == 0) {
                Navigator.pushReplacementNamed(context, '/home');
              }
            },
            items: const [
              BottomNavigationBarItem(
                icon: Icon(LucideIcons.home, size: 20),
                label: 'Home',
              ),
              BottomNavigationBarItem(
                icon: Icon(LucideIcons.plusCircle, size: 20),
                label: 'Submit',
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSuccessUI() {
    return Scaffold(
      backgroundColor: _C.bg,
      body: Stack(
        children: [
          AnimatedBuilder(
            animation: _orb,
            builder: (_, __) {
              return SizedBox.expand(
                child: CustomPaint(
                  painter: _OrbPainter(_orb.value * 2 * math.pi),
                ),
              );
            },
          ),
          SafeArea(
            child: Center(
              child: Padding(
                padding: const EdgeInsets.all(36),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      width: 96,
                      height: 96,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: const LinearGradient(
                          colors: [Color(0xFF059669), _C.success],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: _C.success.withOpacity(0.4),
                            blurRadius: 32,
                            spreadRadius: 4,
                          ),
                        ],
                      ),
                      child: const Icon(
                        LucideIcons.shieldCheck,
                        color: Colors.white,
                        size: 40,
                      ),
                    ),
                    const SizedBox(height: 36),
                    Text(
                      'Feedback\nSubmitted',
                      style: _T.heading.copyWith(fontSize: 38),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Your voice has been heard.\nThank you for making campus better.',
                      textAlign: TextAlign.center,
                      style: _T.body.copyWith(fontSize: 15, color: _C.textLo),
                    ),
                    const SizedBox(height: 56),
                    GestureDetector(
                      onTap: _resetForm,
                      child: Container(
                        width: double.infinity,
                        height: 58,
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [_C.primary, _C.accent],
                            begin: Alignment.centerLeft,
                            end: Alignment.centerRight,
                          ),
                          borderRadius: BorderRadius.circular(18),
                          boxShadow: [
                            BoxShadow(
                              color: _C.accent.withOpacity(0.3),
                              blurRadius: 24,
                              offset: const Offset(0, 8),
                            ),
                          ],
                        ),
                        child: Center(
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(
                                LucideIcons.refreshCw,
                                size: 16,
                                color: Colors.white,
                              ),
                              const SizedBox(width: 10),
                              Text(
                                'SUBMIT NEW FEEDBACK',
                                style: _T.mono.copyWith(
                                  color: Colors.white,
                                  fontSize: 12,
                                  letterSpacing: 1.5,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),
                    TextButton.icon(
                      onPressed: () {
                        Navigator.pushReplacementNamed(context, '/home');
                      },
                      icon: const Icon(
                        LucideIcons.home,
                        size: 14,
                        color: _C.textLo,
                      ),
                      label: Text(
                        'Back to Home',
                        style: _T.body.copyWith(fontSize: 13, color: _C.textLo),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
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
      size.width * 0.8 + math.sin(t) * 40,
      size.height * 0.15 + math.cos(t * 0.7) * 30,
    );

    canvas.drawCircle(
      p1,
      200,
      Paint()
        ..shader = const RadialGradient(
          colors: [Color(0x251A56DB), Colors.transparent],
        ).createShader(Rect.fromCircle(center: p1, radius: 200)),
    );

    final p2 = Offset(
      size.width * 0.15 + math.cos(t * 0.6) * 30,
      size.height * 0.6 + math.sin(t * 0.8) * 25,
    );

    canvas.drawCircle(
      p2,
      160,
      Paint()
        ..shader = const RadialGradient(
          colors: [Color(0x1838BDF8), Colors.transparent],
        ).createShader(Rect.fromCircle(center: p2, radius: 160)),
    );

    final p3 = Offset(
      size.width * 0.5 + math.sin(t * 0.4 + 1) * 20,
      size.height * 0.85 + math.cos(t * 0.5) * 15,
    );

    canvas.drawCircle(
      p3,
      120,
      Paint()
        ..shader = const RadialGradient(
          colors: [Color(0x1034D399), Colors.transparent],
        ).createShader(Rect.fromCircle(center: p3, radius: 120)),
    );
  }

  @override
  bool shouldRepaint(_OrbPainter oldDelegate) => oldDelegate.t != t;
}