import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../services/auth_service.dart';
import '../widgets/developer_footer.dart';
import '../widgets/masseq_logo.dart';
import 'home_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key, required this.authService});

  final AuthService authService;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _usernameCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _passwordFocus = FocusNode();

  bool _obscurePassword = true;
  bool _loading = false;
  String? _authError;

  @override
  void dispose() {
    _usernameCtrl.dispose();
    _passwordCtrl.dispose();
    _passwordFocus.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_loading) return;
    setState(() => _authError = null);
    if (!_formKey.currentState!.validate()) return;

    FocusScope.of(context).unfocus();
    setState(() => _loading = true);
    final result = await widget.authService.login(
      _usernameCtrl.text,
      _passwordCtrl.text,
    );
    if (!mounted) return;
    setState(() => _loading = false);

    if (result == LoginResult.success) {
      final username = _usernameCtrl.text.trim();
      _passwordCtrl.clear();
      await Navigator.of(context).pushReplacement(
        MaterialPageRoute<void>(
          builder: (_) => HomeScreen(
            username: username,
            authService: widget.authService,
          ),
        ),
      );
      return;
    }

    setState(() => _authError = result.message);
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(result.message!)));
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) => SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 24),
            child: ConstrainedBox(
              // Centra verticalmente cuando hay espacio; con el teclado abierto
              // el contenido simplemente se desplaza.
              constraints: BoxConstraints(minHeight: constraints.maxHeight - 48),
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 380),
                  child: Form(
                    key: _formKey,
                    autovalidateMode: AutovalidateMode.onUserInteraction,
                    onChanged: () {
                      if (_authError != null) setState(() => _authError = null);
                    },
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const MasseqLogo(),
                        const SizedBox(height: 36),
                        Text(
                          'LOGIN',
                          style: theme.textTheme.headlineMedium?.copyWith(
                            fontWeight: FontWeight.w800,
                            letterSpacing: 1,
                          ),
                        ),
                        const SizedBox(height: 24),
                        TextFormField(
                          key: const Key('usernameField'),
                          controller: _usernameCtrl,
                          enabled: !_loading,
                          textInputAction: TextInputAction.next,
                          autofillHints: const [AutofillHints.username],
                          decoration: const InputDecoration(
                            labelText: 'Username',
                            prefixIcon: Icon(Icons.person_outline),
                          ),
                          validator: (v) => (v == null || v.trim().isEmpty)
                              ? 'Ingresa el usuario.'
                              : null,
                          onFieldSubmitted: (_) => _passwordFocus.requestFocus(),
                        ),
                        const SizedBox(height: 16),
                        TextFormField(
                          key: const Key('passwordField'),
                          controller: _passwordCtrl,
                          focusNode: _passwordFocus,
                          enabled: !_loading,
                          obscureText: _obscurePassword,
                          obscuringCharacter: '•',
                          textInputAction: TextInputAction.done,
                          autofillHints: const [AutofillHints.password],
                          decoration: InputDecoration(
                            labelText: 'Password',
                            prefixIcon: const Icon(Icons.lock_outline),
                            suffixIcon: IconButton(
                              key: const Key('togglePassword'),
                              tooltip: _obscurePassword
                                  ? 'Mostrar contraseña'
                                  : 'Ocultar contraseña',
                              icon: Icon(
                                _obscurePassword
                                    ? Icons.visibility_outlined
                                    : Icons.visibility_off_outlined,
                              ),
                              onPressed: () => setState(
                                () => _obscurePassword = !_obscurePassword,
                              ),
                            ),
                          ),
                          validator: (v) => (v == null || v.isEmpty)
                              ? 'Ingresa la contraseña.'
                              : null,
                          onFieldSubmitted: (_) => _submit(),
                        ),
                        if (_authError != null) ...[
                          const SizedBox(height: 12),
                          Text(
                            _authError!,
                            key: const Key('authError'),
                            style: TextStyle(color: theme.colorScheme.error),
                            textAlign: TextAlign.center,
                          ),
                        ],
                        const SizedBox(height: 28),
                        FractionallySizedBox(
                          widthFactor: 0.6,
                          child: FilledButton(
                            key: const Key('loginButton'),
                            onPressed: _loading ? null : _submit,
                            child: _loading
                                ? const SizedBox.square(
                                    dimension: 22,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2.5,
                                      color: Colors.white,
                                    ),
                                  )
                                : const Text('Ingresar'),
                          ),
                        ),
                        const SizedBox(height: 32),
                        SvgPicture.asset(
                          'assets/images/volqueta.svg',
                          height: 120,
                          semanticsLabel: 'Ilustración de una volqueta',
                        ),
                        const SizedBox(height: 24),
                        const DeveloperFooter(),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
