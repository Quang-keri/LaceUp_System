class TermsSection {
  final String title;
  final List<TermsSubSection> children;

  const TermsSection({
    required this.title,
    required this.children,
  });
}

class TermsSubSection {
  final String title;
  final List<String> bullets;

  const TermsSubSection({
    required this.title,
    required this.bullets,
  });
}