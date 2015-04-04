var tipMe = angular.module("tipMe",[]);

tipMe.controller("Wizard", function($scope, $http){

    var state = new State();

    var getBroadcasterId = new ActionStep("Hi there!  What is your MFC Model Name?",
        "Find My BroadcasterID!", "Your model name..." , function(){
            var step = this;
            state.setModelName($scope.inputValue);
            step.convo = "Thanks! I'm trying to determine it now...";
            $http.get("//mfcuserlookup.azurewebsites.net/?username=" + $scope.inputValue)
                .then(function(response){
                    if (response.data && response.data.error){
                        step.convo = "Sorry, the server said, " + response.data.error + " Try again?";
                    } else {
                        $scope.inputValue = "";
                        state.setBroadcasterId(response.data.uid);
                        $scope.currentStep = imageOrText;
                    }
                }, function(error){
                    step.convo = "Sorry, I had trouble looking up the broadcasterId.  Try again?";
                });
    });

    var imageOrText = new ChoiceStep("Would you like to use an image or text?", function(){
        $scope.inputValue = "";
        $scope.currentStep = chooseImage;
    }, function(){
        $scope.inputValue = "";
        $scope.currentStep = setText;
    }, "Image", "Text");

    var setText = new ActionStep("What would you like the link to say?",
        "Say that!",  "Tip me!", function(){
            var step = this;
            var text = $scope.inputValue;
            if (text == ""){
                step.convo = "Sorry, you didn't seem to tell me anything!";
            } else {
                state.setTipMeText($scope.inputValue);
                $scope.inputValue = "";
                $scope.currentStep = confirmAmount;
            }
    });

    var chooseImage = new ActionStep("Please enter the URL for the image you want to use", "Select", "Image url...", function(){
        var step = this;
        state.setImgHref($scope.inputValue);
        $scope.inputValue = "";
        $scope.currentStep = confirmImage;
    });

    var confirmImage = new ChoiceStep("Does that look right?", function(){
        $scope.inputValue = "";
        $scope.currentStep = confirmAmount;
    }, function(){
        $scope.inputValue = "";
        $scope.currentStep = chooseImage;
    });

    var confirmAmount = new ChoiceStep("Do you want to add an amount?", function(){
        $scope.inputValue = "";
        $scope.currentStep = getTipAmount;
    }, function(){
        $scope.inputValue = "";
        $scope.currentStep = confirmComment;
    });

    var getTipAmount = new ActionStep("What is the amount?", "Looks about right!", "How many tokens...", function(){
        var step= this;
        var amt = $scope.inputValue;
        if ("" == amt) {
            step.convo = "Sorry, you don't appear to have entered an amount!";
            return;
        }
        if (isNaN(parseInt(amt, 10)) || parseInt(amt,10) < 1) {
            step.convo = "Sorry, that doesn't appear to be a positive number!";
            return;
        }
        state.setTipAmount(amt);
        $scope.inputValue = "";
        $scope.currentStep = confirmComment;
    });

    var confirmComment = new ChoiceStep("Do you want to add a tip note?", function(){
        $scope.inputValue = "";
        $scope.currentStep = getTipComment;
    }, function(){
        $scope.inputValue = "";
        $scope.currentStep = done;
    });

    var getTipComment = new ActionStep("What would you like the note to say?", "Say that!", "", function(){
        var step = this;
        var note = $scope.inputValue;
         if ("" == note) {
             this.convo = "Sorry, you didn't appear to enter a note?";
             return;
         }
        state.setTipComment(note);
        $scope.inputValue = "";
        $scope.currentStep = done;
    });

    var done = new NonActionStep("That's it!  You're done!  Copy the text you need below.");

    $scope.currentStep = getBroadcasterId;
    $scope.state = state;

});

function ChoiceStep(choiceText, firstChoiceAction, secondChoiceAction, firstChoiceText, secondChoiceText){
    this.isChoiceStep = true;
    this.isActionStep = false;
    this.convo = choiceText;
    this.firstChoiceText = firstChoiceText || "Yes";
    this.secondChoiceText = secondChoiceText || "No";
    this.firstChoiceAction = firstChoiceAction;
    this.secondChoiceAction = secondChoiceAction;
}

function ActionStep(convo, actionText, placeHolder, action){
    this.convo = convo;
    this.actionText = actionText;
    this.inputPlaceholder = placeHolder;
    this.onAction = action;
    this.isChoiceStep = false;
    this.isActionStep = true;
}

function NonActionStep(convo){
    this.isChoiceStep = false;
    this.isActionStep = false;
    this.convo = convo;
}

function State() {
    var linkTemplate = "<a href='HREF_TEXT'>TIPME_TEXT</a>";
    var hrefTemplate = "http://www.myfreecams.com/mfc2/php/tip.php?&request=tip&broadcaster_id=BROADCASTER_ID";
    var imgTemplate = "<img src='SRC_TEXT' />";

    var tipMeText = null;
    var imgHref = null;
    var broadCasterId = null;
    var tipAmount = null;
    var tipComment = null;
    var modelName = null;

    this.setModelName = function(name){
        modelName = name;
    }
    this.getModelName = function(){return modelName;}

    this.hasBroadcasterId = function(){ return null !== broadCasterId;}

    this.setBroadcasterId = function(id){
        broadCasterId = id;
    }
    this.setTipMeText = function(txt){
        tipMeText = txt;
    }
    this.setImgHref = function(href){
        imgHref = href;
    }
    this.setTipAmount = function(amt){
        tipAmount = amt;
    }
    this.setTipComment = function(txt){
        tipComment = txt;
    }

    this.getUrl = function(){
        var url = hrefTemplate.replace("BROADCASTER_ID", broadCasterId || "BROADCASTER_ID");

        if (null !== tipAmount)
            url += "&tip_value=" + tipAmount;

        if (null !== tipComment)
            url += "&comment=" + tipComment;

        return url;
    }

    this.getImg = function(){
        return imgTemplate.replace("SRC_TEXT", imgHref);
    }

    this.getLink = function(){
        if (null === imgHref)
            return linkTemplate.replace("HREF_TEXT", this.getUrl()).replace("TIPME_TEXT", tipMeText || "TIPME_TEXT");

        return linkTemplate.replace("HREF_TEXT", this.getUrl()).replace("TIPME_TEXT", this.getImg());
    }
}

