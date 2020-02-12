var restore = {};

restore.processRestore = function(req, res, next){
    
    if(req.session.profile){
        var studentId = res.locals.studentId;
        var courseResult = res.locals.courseResult;
        //console.log(courseResult[0]);
        var allScore = JSON.parse(req.pass);
        var courses = req.changeCourses;
        courses = JSON.parse(courses);
        //console.log("change courses:");
        //console.log(courses);
        var restore = [];
        var restoreIndex = [];
        var tempPre = [];
        var tempNext = [];
        var restorePreGeneralNew = [];
        var restoreNextGeneralNew = [];
        var general_old_dim = [];
        var general_new_dim = [];

        for(var i = 0; i<12; i++){
            var course = {
                pre:[],
                next:[]
            }
            restore.push(course);
        }
        for(var i = 0; i<12; i++){
            var course = {
                pre:[],
                next:[]
            }
            restoreIndex.push(course);
        }
        for(var i = 0; i<courses.length; i++){
            if(courses[i].now_pos == '...') continue;
            if(courses[i].orig_pos == null) continue;
            if(courses[i].orig_pos == '共同必修'){
                restore[0].pre[courses[i].cos_cname] = true;
                restoreIndex[0].pre.push(courses[i].cos_cname);    
            }
            else if(courses[i].orig_pos == '專業選修'){
                restore[1].pre[courses[i].cos_cname] = true;
                restoreIndex[1].pre.push(courses[i].cos_cname);
            }
            else if(courses[i].orig_pos == '其他選修'){
                restore[2].pre[courses[i].cos_cname] = true;
                restoreIndex[2].pre.push(courses[i].cos_cname);
            }
            else if(courses[i].orig_pos == '外語'){
                restore[3].pre[courses[i].cos_cname] = true;
                restoreIndex[3].pre.push(courses[i].cos_cname);
            }
            else if(courses[i].orig_pos.substring(0,6) == '通識(舊制)'){
                restore[4].pre[courses[i].cos_cname] = true;
                restoreIndex[4].pre.push(courses[i].cos_cname);
            }
            else if(courses[i].orig_pos.substring(0,6) == '通識(新制)'){
                restore[5].pre[courses[i].cos_cname] = true;
                restoreIndex[5].pre.push(courses[i].cos_cname);
                restorePreGeneralNew[courses[i].cos_cname] = courses[i].orig_pos;
            }
            else if(courses[i].orig_pos == '體育'){
                restore[6].pre[courses[i].cos_cname] = true;
                restoreIndex[6].pre.push(courses[i].cos_cname);
            }
            else if(courses[i].orig_pos == '服務學習'){
                restore[7].pre[courses[i].cos_cname] = true;
                restoreIndex[7].pre.push(courses[i].cos_cname);
            }
            else if(courses[i].orig_pos == '藝文賞析'){
                restore[8].pre[courses[i].cos_cname] = true;
                restoreIndex[8].pre.push(courses[i].cos_cname);
            }
            // 9 for military (can't move)
            else if(courses[i].orig_pos == '抵免研究所課程'){
                restore[10].pre[courses[i].cos_cname] = true;
                restoreIndex[10].pre.push(courses[i].cos_cname);
            }
            else if(courses[i].orig_pos == '雙主修、輔系、學分學程'){
                restore[11].pre[courses[i].cos_cname] = true;
                restoreIndex[11].pre.push(courses[i].cos_cname);
            }
            if(courses[i].now_pos == '共同必修'){
                restore[0].next[courses[i].cos_cname] = true;
                restoreIndex[0].next.push(courses[i].cos_cname);
            }
            else if(courses[i].now_pos == '專業選修'){
                restore[1].next[courses[i].cos_cname] = true;
                restoreIndex[1].next.push(courses[i].cos_cname);
            }
            else if(courses[i].now_pos == '其他選修'){
                restore[2].next[courses[i].cos_cname] = true;
                restoreIndex[2].next.push(courses[i].cos_cname);
            }
            else if(courses[i].now_pos == '外語'){
                restore[3].next[courses[i].cos_cname] = true;
                restoreIndex[3].next.push(courses[i].cos_cname);
            } 
            else if(courses[i].now_pos.substring(0,6) == '通識(舊制)'){
                restore[4].next[courses[i].cos_cname] = true;
                restoreIndex[4].next.push(courses[i].cos_cname);
                general_old_dim[courses[i].cos_cname] = courses[i].now_pos.substring(7,9);
            }
            else if(courses[i].now_pos.substring(0,6) == '通識(新制)'){
                restore[5].next[courses[i].cos_cname] = true;
                restoreIndex[5].next.push(courses[i].cos_cname);
                restoreNextGeneralNew[courses[i].cos_cname] = courses[i].now_pos;
            }
            else if(courses[i].now_pos == '體育'){
                restore[6].next[courses[i].cos_cname] = true;
                restoreIndex[6].next.push(courses[i].cos_cname);
            }
            else if(courses[i].now_pos == '服務學習'){
                restore[7].next[courses[i].cos_cname] = true;
                restoreIndex[7].next.push(courses[i].cos_cname);
            }
            else if(courses[i].now_pos == '藝文賞析'){
                restore[8].next[courses[i].cos_cname] = true;
                restoreIndex[8].next.push(courses[i].cos_cname);
            }
            else if(courses[i].now_pos == '抵免研究所課程'){
                restore[10].next[courses[i].cos_cname] = true;
                restoreIndex[10].next.push(courses[i].cos_cname);
            }
            else if(courses[i].now_pos == '雙主修、輔系、學分學程'){
                restore[11].next[courses[i].cos_cname] = true;
                restoreIndex[11].next.push(courses[i].cos_cname);
            }
        }
       //console.log(restore);
       //console.log(restoreIndex);
       //console.log(courseResult[6]);

       for(var i = 0; i<courseResult.length; i++){
        if(i == 9) continue;
        for(var q = 0; q<courseResult[i].course.length; q++){
            if(restore[i].pre[courseResult[i].course[q].cn] == true){
               restore[i].pre[courseResult[i].course[q].cn] = false;

               let cos = courseResult[i].course[q];
               let cosName = cos.cn; 
               for(let j = 0; j < allScore.length; j++){
                    if(cosName == allScore[j].cos_cname){
                        if(allScore[j].brief)
                            general_old_dim[cosName] = allScore[j].brief.substring(0,2);
                        if(allScore[j].brief_new){
                            general_new_dim[cosName] = allScore[j].brief_new.substring(0,5);
                            if(general_new_dim[cosName] == '跨院基本素') general_new_dim[cosName] = '跨院基本素養';
                        }
                    }
               }
                // Move from old general
                if(i == 4) {
                    // new
                    courseResult[i].credit -= parseFloat(courseResult[i].course[q].realCredit);
                    tempPre[cosName] = cos;
                    courseResult[i].course.splice(q,1);
                    // old
                    courseResult[5].credit.total -= parseFloat(cos.realCredit); 
                    if(general_new_dim[cosName].substring(0,2) == '核心')
                        courseResult[5].credit.core -= parseFloat(cos.realCredit);
                    else if(general_new_dim[cosName].substring(0,2) == '跨院')
                        courseResult[5].credit.cross -= parseFloat(cos.realCredit);
                    else if(general_new_dim[cosName].substring(0,2) == '校基')
                        courseResult[5].credit.basic -= parseFloat(cos.realCredit);
                    for(var k = 0; k < courseResult[5].course.length; k++){
                        if(cosName == courseResult[5].course[k].cn){
                            courseResult[5].course.splice(k,1);
                            break;
                        }
                    }
                }
                // Move from new general
                else if(i == 5) {
                    // old
                    courseResult[4].credit  -= parseFloat(cos.realCredit);
                    for(var k = 0; k < courseResult[4].course.length; k++){
                        if(cosName == courseResult[4].course[k].cn){
                            courseResult[4].course.splice(k,1);
                            break;
                        }
                    }
                    // new
                    courseResult[i].credit.total -= parseFloat(cos.realCredit);
                    tempPre[cosName] = cos;
                    courseResult[i].course.splice(q,1);
                    let dim = restorePreGeneralNew[cosName].substring(7);
                    if(dim.substring(0,2) == '核心')
                        courseResult[i].credit.core -= parseFloat(cos.realCredit);
                    else if(dim.substring(0,2) == '跨院')
                        courseResult[i].credit.cross -= parseFloat(cos.realCredit);
                    else if(dim.substring(0,2) == '校基')
                        courseResult[i].credit.basic -= parseFloat(cos.realCredit);
                }
                // Move from other place
                else{
                    tempPre[courseResult[i].course[q].cn] = courseResult[i].course[q];
                    courseResult[i].credit -= parseFloat(courseResult[i].course[q].realCredit);
                    courseResult[i].course.splice(q,1);
                }
                q--;
            }
        }
       }
      // console.log(tempPre);
       //push the course the course in next to the new position
       for(var i = 0; i<courseResult.length; i++){
        if(i == 9) continue;
        for(var q = 0; q<restoreIndex[i].next.length; q++){
                let cosName = restoreIndex[i].next[q];
                let cos = tempPre[cosName];
                if(typeof(cos) != undefined && cos ){
                    if(i == 4){
                        courseResult[i].credit += parseFloat(cos.realCredit);
                        courseResult[5].credit.total += parseFloat(cos.realCredit);
                        let temp_general_old = Object.assign({}, cos);
                        let temp_general_new = Object.assign({}, cos);
                        temp_general_old.dimension = general_old_dim[cosName];
                        if (temp_general_old.dimension == null) temp_general_old.dimension = '自然';
                        temp_general_new.dimension = general_new_dim[cosName];
                        if (temp_general_new.dimension == null) temp_general_new.dimension = '校基本素養';
                        courseResult[i].course.push(temp_general_old);
                        courseResult[5].course.push(temp_general_new);
                        if(temp_general_new.dimension.substring(0,2) == '核心')
                            courseResult[5].credit.core += parseFloat(cos.realCredit);
                        else if(temp_general_new.dimension.substring(0,2) == '跨院')
                            courseResult[5].credit.cross += parseFloat(cos.realCredit);
                        else if(temp_general_new.dimension.substring(0,2) == '校基')
                            courseResult[5].credit.basic += parseFloat(cos.realCredit);
                    }
                    else if(i == 5){
                        // old general
                        courseResult[4].credit += parseFloat(cos.realCredit);
                        let temp_general_old = Object.assign({}, cos);
                        temp_general_old.dimension = general_old_dim[cosName];
                        if (temp_general_old.dimension == null) temp_general_old.dimension = '自然';
                        courseResult[4].course.push(temp_general_old);
                        // new general
                        courseResult[5].credit.total += parseFloat(cos.realCredit);
                        let temp_general_new = Object.assign({}, cos);
                        temp_general_new.dimension = restoreNextGeneralNew[cosName].substring(7);
                        if (temp_general_new.dimension == null) temp_general_new.dimension = '校基本素養';
                        courseResult[i].course.push(temp_general_new);
                        if(temp_general_new.dimension.substring(0,2) == '核心')
                            courseResult[5].credit.core += parseFloat(cos.realCredit);
                        else if(temp_general_new.dimension.substring(0,2) == '跨院')
                            courseResult[5].credit.cross += parseFloat(cos.realCredit);
                        else if(temp_general_new.dimension.substring(0,2) == '校基')
                            courseResult[5].credit.basic += parseFloat(cos.realCredit);
                    }
                    else {
                        courseResult[i].course.push(tempPre[restoreIndex[i].next[q]]);
                        courseResult[i].credit += parseFloat(tempPre[restoreIndex[i].next[q]].realCredit);
                    }
                }
            }
        }
       res.locals.courseResult = courseResult;
    }
    else
        res.redirect('/');
    next();

}

exports.restore = restore;
