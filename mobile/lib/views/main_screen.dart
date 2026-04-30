import 'package:flutter/material.dart';

import '../widgets/header.dart';
import 'area/area_tab.dart';
import 'match/match_tab.dart';

class MainScreen extends StatelessWidget {
  const MainScreen({super.key, required userData});

  @override
  Widget build(BuildContext context) {
    return const DefaultTabController(
      length: 2,
      initialIndex: 0,
      child: Scaffold(
        appBar: CustomHeader(),
        backgroundColor: Color(0xFFF8F9FA),
        body: TabBarView(
          children: [
            AreaTab(),
            MatchTab(),
          ],
        ),
      ),
    );
  }
}