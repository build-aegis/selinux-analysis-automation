**Review of SELinux Policy Analysis Tools**

**Area of Study**

Our work reviews existing analysis tools for SELinux security policies and proposes improvements to address current challenges.

**Key Points**

- SELinux implements mandatory access control (MAC) in Linux systems
- SELinux policies are complex and difficult to develop and analyze
- Many tools have been created to help analyze SELinux policies, but they have limitations

**Existing Tools Reviewed**

The paper **Review of Existing Analysis Tools for SELinux Security Policies: Challenges and a Proposed Solution** reviews 18 different SELinux policy analysis tools, including:

- APOL
- SLAT
- XcelLog
- GOKYO
- PAL
- SEGrapher
- SEAnalyzer
- PVA/GPA
- SELint

**Challenges Identified**

- Complexity of SELinux policy language
- Lack of formal semantics
- Difficulty expressing high-level security goals
- Limited query capabilities of existing tools
- Lack of provable correctness for analysis results

**Proposed Solution**

- Adopt a certified policy language like ACCPL (A Certified Core Policy Language)
- Develop a domain-specific certified language for SELinux policies
- Leverage formal verification capabilities [WIP]
- Simplify policy development and analysis [WIP]

**Future Work**

Design certified domain-specific policy language based on ACCPL
Develop certified analysis tools using the new language